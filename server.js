const express = require('express');
const admin = require('firebase-admin');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : require('./serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ─────────────────────────────────────────────
// VERIFY FIREBASE TOKEN
// ─────────────────────────────────────────────
async function verifyToken(req, res, next) {
  const token = req.headers.authorization?.split('Bearer ')[1];

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ─────────────────────────────────────────────
// CREATE USER PROFILE
// ─────────────────────────────────────────────
app.post('/api/users', verifyToken, async (req, res) => {
  try {
    const { username, bio } = req.body;
    const uid = req.user.uid;

    const existing = await db
      .collection('users')
      .where('username', '==', username)
      .get();

    if (!existing.empty) {
      return res.status(400).json({
        error: 'Username already taken'
      });
    }

    await db.collection('users').doc(uid).set({
      uid,
      username,
      bio: bio || '',
      email: req.user.email,
      followers: [],
      following: [],
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// GET USER PROFILE
// ─────────────────────────────────────────────
app.get('/api/users/:username', async (req, res) => {
  try {
    const snap = await db
      .collection('users')
      .where('username', '==', req.params.username)
      .get();

    if (snap.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = snap.docs[0].data();

    delete user.email;

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// CREATE POST
// ─────────────────────────────────────────────
app.post('/api/posts', verifyToken, async (req, res) => {
  try {
    const { caption, imageUrl } = req.body;

    const uid = req.user.uid;

    const userDoc = await db.collection('users').doc(uid).get();

    const user = userDoc.data();

    const postId = uuidv4();

    await db.collection('posts').doc(postId).set({
      id: postId,
      uid,
      username: user.username,
      caption,
      imageUrl: imageUrl || '',
      likes: [],
      commentCount: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, postId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// GET ALL POSTS
// ─────────────────────────────────────────────
app.get('/api/posts', async (req, res) => {
  try {
    const snap = await db
      .collection('posts')
      .orderBy('createdAt', 'desc')
      .limit(30)
      .get();

    const posts = snap.docs.map(doc => doc.data());

    res.json(posts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// GET POSTS BY USERNAME
// ─────────────────────────────────────────────
app.get('/api/posts/user/:username', async (req, res) => {
  try {
    const snap = await db
      .collection('posts')
      .where('username', '==', req.params.username)
      .orderBy('createdAt', 'desc')
      .get();

    res.json(snap.docs.map(doc => doc.data()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// LIKE / UNLIKE POST
// ─────────────────────────────────────────────
app.post('/api/posts/:postId/like', verifyToken, async (req, res) => {
  try {
    const { postId } = req.params;

    const uid = req.user.uid;

    const ref = db.collection('posts').doc(postId);

    const post = (await ref.get()).data();

    const liked = post.likes.includes(uid);

    await ref.update({
      likes: liked
        ? admin.firestore.FieldValue.arrayRemove(uid)
        : admin.firestore.FieldValue.arrayUnion(uid)
    });

    res.json({ liked: !liked });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// ADD COMMENT
// ─────────────────────────────────────────────
app.post('/api/posts/:postId/comments', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;

    const uid = req.user.uid;

    const userDoc = await db.collection('users').doc(uid).get();

    const user = userDoc.data();

    const commentId = uuidv4();

    await db
      .collection('posts')
      .doc(req.params.postId)
      .collection('comments')
      .doc(commentId)
      .set({
        id: commentId,
        uid,
        username: user.username,
        text,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

    await db.collection('posts').doc(req.params.postId).update({
      commentCount: admin.firestore.FieldValue.increment(1)
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// GET COMMENTS
// ─────────────────────────────────────────────
app.get('/api/posts/:postId/comments', async (req, res) => {
  try {
    const snap = await db
      .collection('posts')
      .doc(req.params.postId)
      .collection('comments')
      .orderBy('createdAt')
      .get();

    res.json(snap.docs.map(doc => doc.data()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// FOLLOW / UNFOLLOW USER
// ─────────────────────────────────────────────
app.post('/api/users/:username/follow', verifyToken, async (req, res) => {
  try {
    const myUid = req.user.uid;

    const targetSnap = await db
      .collection('users')
      .where('username', '==', req.params.username)
      .get();

    if (targetSnap.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    const targetUid = targetSnap.docs[0].id;

    const myRef = db.collection('users').doc(myUid);
    const theirRef = db.collection('users').doc(targetUid);

    const myData = (await myRef.get()).data();

    const alreadyFollowing = myData.following.includes(targetUid);

    if (alreadyFollowing) {
      await myRef.update({
        following: admin.firestore.FieldValue.arrayRemove(targetUid)
      });

      await theirRef.update({
        followers: admin.firestore.FieldValue.arrayRemove(myUid)
      });

      res.json({ following: false });
    } else {
      await myRef.update({
        following: admin.firestore.FieldValue.arrayUnion(targetUid)
      });

      await theirRef.update({
        followers: admin.firestore.FieldValue.arrayUnion(myUid)
      });

      res.json({ following: true });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// SEND MESSAGE
// ─────────────────────────────────────────────
app.post('/api/messages', verifyToken, async (req, res) => {
  try {
    const { toUid, text } = req.body;

    const fromUid = req.user.uid;

    const chatId = [fromUid, toUid].sort().join('_');

    const msgId = uuidv4();

    await db
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .doc(msgId)
      .set({
        id: msgId,
        fromUid,
        toUid,
        text,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// GET MESSAGES
// ─────────────────────────────────────────────
app.get('/api/messages/:toUid', verifyToken, async (req, res) => {
  try {
    const fromUid = req.user.uid;

    const chatId = [fromUid, req.params.toUid]
      .sort()
      .join('_');

    const snap = await db
      .collection('chats')
      .doc(chatId)
      .collection('messages')
      .orderBy('createdAt')
      .get();

    res.json(snap.docs.map(doc => doc.data()));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// SEARCH USERS
// ─────────────────────────────────────────────
app.get('/api/search', async (req, res) => {
  try {
    const q = req.query.q?.toLowerCase() || '';

    const snap = await db.collection('users').get();

    const results = snap.docs
      .map(doc => doc.data())
      .filter(user => user.username.toLowerCase().includes(q))
      .slice(0, 10)
      .map(user => ({
        uid: user.uid,
        username: user.username,
        bio: user.bio
      }));

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ─────────────────────────────────────────────
// DEFAULT ROUTE
// ─────────────────────────────────────────────
app.get('/', (req, res) => {
  res.send('SnapLink Backend Running');
});

// ─────────────────────────────────────────────
// START SERVER
// ─────────────────────────────────────────────
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`SnapLink running on http://localhost:${PORT}`);
});