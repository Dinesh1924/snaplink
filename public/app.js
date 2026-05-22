const firebaseConfig = {
  apiKey: "AIzaSyBoYrb0iNRJuZJ2-_2cbnIiIawQFHUWu9I",
  authDomain: "snaplink-bdd8d.firebaseapp.com",
  projectId: "snaplink-bdd8d",
  storageBucket: "snaplink-bdd8d.firebasestorage.app",
  messagingSenderId: "518707203618",
  appId: "1:518707203618:web:9f04ad48de494a9302447b"
};

firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();

function switchTab(tab) {

  document.getElementById("login-form").style.display =
    tab === "login" ? "block" : "none";

  document.getElementById("signup-form").style.display =
    tab === "signup" ? "block" : "none";
}

async function signup() {

  const username =
    document.getElementById("signup-username");

  const email =
    document.getElementById("signup-email");

  const password =
    document.getElementById("signup-pass");

  const bio =
    document.getElementById("signup-bio");

  document.getElementById("auth-error").innerText = "";

  try {

    const userCredential =
      await auth.createUserWithEmailAndPassword(
        email.value,
        password.value
      );
          await db.collection("users")
      .doc(userCredential.user.uid)
      .set({
        username: username.value,
        email: email.value,
        bio: bio.value,
        phone: "",
        profilePhoto: "",
        followers: [],
        following: []
      });

    switchTab("login");

    document.getElementById("login-email").value =
      email.value;

  } catch (error) {

    document.getElementById("auth-error").innerText =
      error.message;
  }
}

async function login() {

  const email =
    document.getElementById("login-email").value;

  const password =
    document.getElementById("login-pass").value;

  try {

    await auth.signInWithEmailAndPassword(
      email,
      password
    );

    document.getElementById("auth-screen").style.display =
      "none";

    document.getElementById("app").style.display =
      "block";

    await loadUserProfile();

    showHome();
      } catch (error) {

    document.getElementById("auth-error").innerText =
      error.message;
  }
}

async function logout() {

  await auth.signOut();

  location.reload();
}

async function loadUserProfile() {

  const user = auth.currentUser;

  if (!user) return;

  const userDoc =
    await db.collection("users")
      .doc(user.uid)
      .get();

  if (!userDoc.exists) return;

  const userData = userDoc.data();

  document.getElementById("profile-username").innerText =
    userData.username || "username";

  document.getElementById("profile-bio").innerText =
    userData.bio || "No bio added";

  document.getElementById("followers-count").innerText =
    userData.followers
      ? userData.followers.length
      : 0;

  document.getElementById("following-count").innerText =
    userData.following
      ? userData.following.length
      : 0;
        if (userData.profilePhoto) {

    document.getElementById("top-profile-photo").style.backgroundImage =
      `url(${userData.profilePhoto})`;

    document.getElementById("main-profile-photo").style.backgroundImage =
      `url(${userData.profilePhoto})`;
  }else {

  document.getElementById("top-profile-photo").style.backgroundImage =
    "";

  document.getElementById("main-profile-photo").style.backgroundImage =
    "";
}
}

function hideAllPages() {

  document.getElementById("feed-posts").style.display =
    "none";

  document.getElementById("profile-page").style.display =
    "none";

  document.querySelector(".create-post").style.display =
    "none";
}

async function showHome() {

  hideAllPages();

  document.getElementById("feed-posts").style.display =
    "block";

  const feed =
    document.getElementById("feed-posts");

  try {

    const posts =
      await fetch("/api/posts")
        .then(res => res.json());

    feed.innerHTML = "";
        posts.forEach(post => {

      const div =
        document.createElement("div");

      div.className = "post-card";

      div.innerHTML = `
        <h3>@${post.username || "user"}</h3>

        <p>${post.caption || ""}</p>

        ${
          post.imageUrl
            ? `<img src="${post.imageUrl}" style="width:100%; border-radius:10px; margin-top:10px;">`
            : ""
        }

        <div class="post-actions">
          <button>❤️</button>
          <button>💬</button>
          <button>📤</button>
        </div>
      `;

      feed.appendChild(div);
    });

  } catch (error) {

    feed.innerHTML =
      "<p>No posts available</p>";
  }
}

function showCreate() {

  hideAllPages();

  document.querySelector(".create-post").style.display =
    "block";
}
async function showProfile() {

  hideAllPages();

  document.getElementById("profile-page").style.display =
    "block";

  await loadUserProfile();
}

function showSearch() {
  alert("Search page coming soon");
}

function showMessages() {
  alert("Messages page coming soon");
}

async function uploadProfilePhoto() {

  const file =
    document.getElementById("profile-photo-input").files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = async function(e) {

    const imageData = e.target.result;
   try {

  await db.collection("users")
    .doc(auth.currentUser.uid)
    .set({
      profilePhoto: imageData
    });

  document.getElementById("top-profile-photo").style.backgroundImage =
    `url(${imageData})`;

  document.getElementById("main-profile-photo").style.backgroundImage =
    `url(${imageData})`;

} catch(error) {

  console.log(error);
}

};

reader.readAsDataURL(file);
}
function openPhotoOptions() {

  const menu =
    document.getElementById("photo-options");

  menu.style.display =
    menu.style.display === "block"
      ? "none"
      : "block";
}

function viewProfilePhoto() {

  const photoDiv =
    document.getElementById("main-profile-photo");

  const bg =
    photoDiv.style.backgroundImage;

  if (!bg) {
    alert("No profile photo uploaded");
    return;
  }

  const imageUrl =
    bg.slice(5, -2);

  const viewer =
    document.createElement("div");

  viewer.innerHTML = `
    <div
      style="
        position:fixed;
        top:0;
        left:0;
        width:100%;
        height:100%;
        background:rgba(0,0,0,0.9);
        display:flex;
        justify-content:center;
        align-items:center;
        z-index:9999;
      "
      onclick="this.remove()"
    >
          <img
        src="${imageUrl}"
        style="
          width:350px;
          height:350px;
          border-radius:20px;
          object-fit:cover;
        "
      />
    </div>
  `;

  document.body.appendChild(viewer);
}

function changeProfilePhoto() {

  document.getElementById(
    "profile-photo-input"
  ).click();
}

function openEditProfile() {

  document.getElementById("edit-profile-box").style.display =
    "block";


  document.getElementById("edit-username").value =
    document.getElementById("profile-username").innerText;

  document.getElementById("edit-email").value =
    auth.currentUser.email;

  document.getElementById("edit-bio").value =
    document.getElementById("profile-bio").innerText;
}
async function saveProfileDetails() {

  const username =
    document.getElementById("edit-username").value;

  const phone =
    document.getElementById("edit-phone").value;

  const bio =
    document.getElementById("edit-bio").value;
    try {

  await db.collection("users")
    .doc(auth.currentUser.uid)
    .set({
      username: username,
      phone: phone,
      bio: bio
    }, { merge: true });

  document.getElementById("profile-username").innerText =
    username;

  document.getElementById("profile-bio").innerText =
    bio;

  document.getElementById("edit-profile-box").style.display =
    "none";
     alert("Profile updated successfully");

  } catch(error) {

    console.log(error);

    alert("Failed to update profile");
  }
}
