// Configuración de Firebase
const firebaseConfig = {
    apiKey: "AIzaSyDjzwOZO0ZzMqo2cJ59zQQNENE0kr2vAY0",
    authDomain: "blogsandblogs-ae6d2.firebaseapp.com",
    projectId: "blogsandblogs-ae6d2",
    storageBucket: "blogsandblogs-ae6d2.appspot.com",
    messagingSenderId: "558234925521",
    appId: "1:558234925521:web:d98392298d3a78345d08f0",
    measurementId: "G-24DRRXVENH"
};

// Inicializar Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Referencias a los elementos HTML
const loginBtn = document.getElementById("login");
const logoutBtn = document.getElementById("logout");
const userInfo = document.getElementById("user-info");
const blogForm = document.getElementById("blog-form");
const blogContent = document.getElementById("blog-content");
const publishBtn = document.getElementById("publish");
const blogsDiv = document.getElementById("blogs");

// Función para iniciar sesión con Google
loginBtn.addEventListener("click", async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);
    userInfo.innerHTML = `
        <img src="${result.user.photoURL}" alt="Foto de perfil" style="width: 40px; height: 40px; border-radius: 50%;">
        Bienvenido, ${result.user.displayName}`;
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    blogForm.style.display = "block";
    loadBlogs();
});

// Función para cerrar sesión
logoutBtn.addEventListener("click", () => {
    auth.signOut();
    userInfo.innerHTML = "";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    blogForm.style.display = "none";
    blogsDiv.innerHTML = "";
});

// Función para publicar un blog
publishBtn.addEventListener("click", async () => {
    const content = blogContent.value;
    if (content.trim() === "") return;

    await db.collection("blogs").add({
        content,
        author: auth.currentUser.displayName,
        authorPhoto: auth.currentUser.photoURL,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    blogContent.value = "";
    loadBlogs();
});

// Cargar los blogs en tiempo real
function loadBlogs() {
    db.collection("blogs").orderBy("timestamp", "desc").onSnapshot((snapshot) => {
        blogsDiv.innerHTML = "";
        snapshot.forEach((doc) => {
            const blog = doc.data();
            blogsDiv.innerHTML += `
                <div class="blog">
                    <div style="display: flex; align-items: center;">
                        <img src="${blog.authorPhoto}" alt="Foto de perfil" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
                        <strong>${blog.author}</strong>
                    </div>
                    <p>${blog.content}</p>
                </div>
            `;
        });
    });
}

// Verificación del estado de autenticación
auth.onAuthStateChanged((user) => {
    if (user) {
        userInfo.innerHTML = `
            <img src="${user.photoURL}" alt="Foto de perfil" style="width: 40px; height: 40px; border-radius: 50%;">
            Bienvenido, ${user.displayName}`;
        loginBtn.style.display = "none";
        logoutBtn.style.display = "inline-block";
        blogForm.style.display = "block";
        loadBlogs();
    } else {
        loginBtn.style.display = "inline-block";
        logoutBtn.style.display = "none";
        blogForm.style.display = "none";
        blogsDiv.innerHTML = "";
    }
});
