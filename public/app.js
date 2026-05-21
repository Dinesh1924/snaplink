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

  const email =
    document.getElementById('signup-email').value;

  const password =
    document.getElementById('signup-pass').value;

  try {

    await auth.createUserWithEmailAndPassword(
      email,
      password
    );

    alert("Signup Successful 🎉");

  } catch (error) {

    document.getElementById('auth-error').innerText =
      error.message;

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

  } catch (error) {

    document.getElementById('auth-error').innerText =
      error.message;

  }

}

async function logout() {

  await auth.signOut();

  location.reload();

}