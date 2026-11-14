import { auth, db } from "./firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";
import {
  doc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

let mode = "login";

const form = document.getElementById("auth-form");
const msg = document.getElementById("msg");
const submitBtn = document.getElementById("submit-btn");
const resendBtn = document.getElementById("resend-btn");
const tabLogin = document.getElementById("tab-login");
const tabRegister = document.getElementById("tab-register");

function show(text, type = "error") {
  msg.textContent = text;
  msg.className = type;
}

function setMode(m) {
  mode = m;
  tabLogin.classList.toggle("active", m === "login");
  tabRegister.classList.toggle("active", m === "register");
  submitBtn.textContent = m === "login" ? "Login" : "Daftar";
  resendBtn.hidden = true;
  show("");
}
tabLogin.onclick = () => setMode("login");
tabRegister.onclick = () => setMode("register");

const errorText = {
  "auth/email-already-in-use": "Email sudah terdaftar.",
  "auth/invalid-email": "Format email salah.",
  "auth/weak-password": "Password minimal 6 karakter.",
  "auth/invalid-credential": "Email atau password salah.",
  "auth/too-many-requests": "Terlalu banyak percobaan, coba lagi nanti."
};

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = form.email.value.trim();
  const password = form.password.value;
  submitBtn.disabled = true;

  try {
    if (mode === "register") {
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      await setDoc(doc(db, "users", cred.user.uid), {
        email,
        tier: "free",
        tenantId: null,
        createdAt: serverTimestamp()
      });

      await sendEmailVerification(cred.user);
      await signOut(auth);
      setMode("login");
      show("Daftar berhasil! Cek email (termasuk spam) buat verifikasi, lalu login.", "ok");
    } else {
      const cred = await signInWithEmailAndPassword(auth, email, password);

      if (!cred.user.emailVerified) {
        show("Email belum diverifikasi. Cek inbox/spam kamu.");
        resendBtn.hidden = false;
        return;
      }
      window.location.href = "dashboard.html";
    }
  } catch (err) {
    show(errorText[err.code] || err.message);
  } finally {
    submitBtn.disabled = false;
  }
});

resendBtn.onclick = async () => {
  try {
    await sendEmailVerification(auth.currentUser);
    show("Email verifikasi dikirim ulang.", "ok");
  } catch (err) {
    show(errorText[err.code] || err.message);
  }
};