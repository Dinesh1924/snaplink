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

    localStorage.setItem(
  email.value + "_username",
  username.value
);

localStorage.setItem(
  email.value + "_bio",
  bio.value
);
    switchTab('login');
    document.getElementById('login-email').value =
  email.value;

    switchTab('login');

    document.getElementById('login-email').value =
      email.value;

    document.getElementById('login-pass').focus();

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
      loadProfilePhoto();
    let savedUsername =
  localStorage.getItem(email + "_username");

let savedBio =
  localStorage.getItem(email + "_bio");

if (!savedUsername) {
  savedUsername =
    document.getElementById("login-email")
      .value
      .split("@")[0];
}

document.getElementById("profile-username").innerText =
  savedUsername;

document.getElementById("profile-bio").innerText =
  savedBio;
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

   localStorage.setItem(
  auth.currentUser.email + "_profilePhoto",
  imageData
);

   document.getElementById("top-profile-photo").style.backgroundImage =
  `url(${imageData})`;

document.getElementById("main-profile-photo").style.backgroundImage =
  `url(${imageData})`;
  };

  reader.readAsDataURL(file);
}

window.onload = function() {
const userEmail = auth.currentUser?.email;

const savedPhoto = userEmail
  ? localStorage.getItem(userEmail + "_profilePhoto")
  : null;

if (savedPhoto) {

  document.getElementById("top-profile-photo").style.backgroundImage =
    `url(${savedPhoto})`;

  document.getElementById("main-profile-photo").style.backgroundImage =
    `url(${savedPhoto})`;
}
};
function openPhotoOptions() {

  const menu =
    document.getElementById("photo-options");

  if (menu.style.display === "block") {
    menu.style.display = "none";
  } else {
    menu.style.display = "block";
  }
}

function viewProfilePhoto() {

  const img =
    document.getElementById("main-profile-photo").src;

  const viewer = document.createElement("div");

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
        src="${img}"
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
document.addEventListener("click", function(event) {

  const menu =
    document.getElementById("photo-options");

  const profilePhoto =
    document.getElementById("main-profile-photo");

  if (
    !menu.contains(event.target) &&
    event.target !== profilePhoto
  ) {
    menu.style.display = "none";
  }
});
function loadProfilePhoto() {

  const userEmail = auth.currentUser?.email;

  const savedPhoto = userEmail
    ? localStorage.getItem(userEmail + "_profilePhoto")
    : null;

  if (savedPhoto) {

    document.getElementById("top-profile-photo").style.backgroundImage =
      `url(${savedPhoto})`;

    document.getElementById("main-profile-photo").style.backgroundImage =
      `url(${savedPhoto})`;

  } else {

    document.getElementById("top-profile-photo").style.backgroundImage = "";

    document.getElementById("main-profile-photo").style.backgroundImage = "";
  }
}
function openEditProfile() {
  document.getElementById("edit-profile-box").style.display = "block";

  document.getElementById("edit-username").value =
    document.getElementById("profile-username").innerText;

  document.getElementById("edit-email").value =
    auth.currentUser.email;

  document.getElementById("edit-bio").value =
    document.getElementById("profile-bio").innerText;
}

function saveProfileDetails() {
  const email = auth.currentUser.email;

  const username =
    document.getElementById("edit-username").value;

  const phone =
    document.getElementById("edit-phone").value;

  const bio =
    document.getElementById("edit-bio").value;

  localStorage.setItem(email + "_username", username);
  localStorage.setItem(email + "_phone", phone);
  localStorage.setItem(email + "_bio", bio);

  document.getElementById("profile-username").innerText = username;
  document.getElementById("profile-bio").innerText = bio;

  document.getElementById("edit-profile-box").style.display = "none";
}