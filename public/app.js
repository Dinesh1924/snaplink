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

function switchTab(tab) {

  document.getElementById('login-form').style.display =
    tab === 'login' ? 'block' : 'none';

  document.getElementById('signup-form').style.display =
    tab === 'signup' ? 'block' : 'none';

}

async function signup() {

  const username =
    document.getElementById('signup-username');

  const email =
    document.getElementById('signup-email');

  const password =
    document.getElementById('signup-pass');

  const bio =
    document.getElementById('signup-bio');

  document.getElementById('auth-error').innerText = "";

  username.style.border = "";
  email.style.border = "";
  password.style.border = "";

  try {

    await auth.createUserWithEmailAndPassword(
      email.value,
      password.value
    );

    switchTab('login');

    document.getElementById('login-email').value =
      email.value;

    document.getElementById('login-pass').focus();
    localStorage.setItem(
  "snaplinkUsername",
  username.value
);

  } catch (error) {

    document.getElementById('auth-error').innerText =
      error.message;

    if(error.message.includes("email")) {
      email.style.border = "2px solid red";
    }

    if(error.message.includes("password")) {
      password.style.border = "2px solid red";
    }

  }

}

async function login() {

  const email =
    document.getElementById('login-email').value;

  const password =
    document.getElementById('login-pass').value;

  try {

    await auth.signInWithEmailAndPassword(
      email,
      password
    );

    document.getElementById('auth-screen').style.display =
      'none';

    document.getElementById('app').style.display =
      'block';
      showHome();
     let savedUsername = localStorage.getItem("snaplinkUsername");

if (!savedUsername) {
  savedUsername = document.getElementById("login-email").value.split("@")[0];
}

document.getElementById("profile-username").innerText =
  savedUsername;
  } catch (error) {

    document.getElementById('auth-error').innerText =
      error.message;

  }

}

async function logout() {

  await auth.signOut();

  location.reload();

}
async function showHome() {
  const feed = document.getElementById("feed-posts");

  const posts = await fetch("/api/posts")
    .then(res => res.json());

  feed.innerHTML = "";

  posts.forEach(post => {
    const div = document.createElement("div");
    div.className = "post-card";

    div.innerHTML = `
      <h3>@${post.username}</h3>
      <p>${post.caption}</p>

      ${
        post.imageUrl
          ? `<img src="${post.imageUrl}" style="width:100%; border-radius:10px; margin-top:10px;">`
          : ""
      }

      <div class="post-actions">
        <button>❤️ ${post.likes ? post.likes.length : 0}</button>
        <button>💬 Comment</button>
        <button>📤 Share</button>
      </div>
    `;

    feed.appendChild(div);
  });
}
async function showProfile() {
  hideAllPages();

  document.getElementById("profile-page").style.display = "block";

  const user = auth.currentUser;

  if (!user) return;

  const res = await fetch(`/api/users/${user.email.split("@")[0]}`);
  const data = await res.json();

  document.getElementById("followers-count").innerText =
    data.followers ? data.followers.length : 0;

  document.getElementById("following-count").innerText =
    data.following ? data.following.length : 0;
}
function hideAllPages() {
  document.getElementById("feed-posts").style.display = "none";
  document.getElementById("profile-page").style.display = "none";
  document.querySelector(".create-post").style.display = "none";
}

function showHome() {
  hideAllPages();
  document.getElementById("feed-posts").style.display = "block";
}

function showCreate() {
  hideAllPages();
  document.querySelector(".create-post").style.display = "block";
}

function showSearch() {
  alert("Search page coming soon");
}

function showMessages() {
  alert("Messages page coming soon");
}
function uploadProfilePhoto() {
  const file = document.getElementById("profile-photo-input").files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = function(e) {
    const imageData = e.target.result;

    localStorage.setItem("profilePhoto", imageData);

    document.getElementById("top-profile-photo").src = imageData;
    document.getElementById("main-profile-photo").src = imageData;
  };

  reader.readAsDataURL(file);
}

window.onload = function() {
  const savedPhoto = localStorage.getItem("profilePhoto");

  if (savedPhoto) {
    document.getElementById("top-profile-photo").src = savedPhoto;
    document.getElementById("main-profile-photo").src = savedPhoto;
  }
};