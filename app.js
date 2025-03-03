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

// Referencias a los elementos del DOM
const loginBtn = document.getElementById("login");
const logoutBtn = document.getElementById("logout");
const blogForm = document.getElementById("blog-form");
const userInfo = document.getElementById("user-info");
const blogsDiv = document.getElementById("blogs");
const followingListDiv = document.getElementById("following-list");
const publishBtn = document.getElementById("publish");
const blogContent = document.getElementById("blog-content");

// Login con Google
loginBtn.addEventListener("click", async () => {
    const provider = new firebase.auth.GoogleAuthProvider();
    const result = await auth.signInWithPopup(provider);

    // Referencia al documento del usuario
    const userRef = db.collection("users").doc(result.user.uid);
    
    // Verificar si el documento ya existe
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
        // Crear el documento si no existe
        await userRef.set({
            displayName: result.user.displayName,
            photoURL: result.user.photoURL,
            following: []  // Lista vacía de usuarios seguidos
        });
    }
    
    // Mostrar la información del usuario
    userInfo.innerHTML = `
        <img src="${result.user.photoURL}" alt="Foto de perfil" style="width: 40px; height: 40px; border-radius: 50%;">
        Bienvenido, ${result.user.displayName}`;
    
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";
    blogForm.style.display = "block";
    
    // Cargar los blogs y los seguidores
    loadBlogs();
    checkFollowing();
});

// Logout
logoutBtn.addEventListener("click", async () => {
    await auth.signOut();
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";
    blogForm.style.display = "none";
    userInfo.innerHTML = "";
    blogsDiv.innerHTML = "";
});

// Seguir a un usuario
function followUser(userID) {
    const userRef = db.collection("users").doc(auth.currentUser.uid);
    userRef.update({
        following: firebase.firestore.FieldValue.arrayUnion(userID)
    }).then(() => {
        alert("Ahora sigues a este usuario.");
        loadBlogs();
    }).catch((error) => {
        console.error("Error al seguir al usuario: ", error);
    });
}

// Dejar de seguir a un usuario
function unfollowUser(userID) {
    const userRef = db.collection("users").doc(auth.currentUser.uid);
    userRef.update({
        following: firebase.firestore.FieldValue.arrayRemove(userID)
    }).then(() => {
        alert("Has dejado de seguir a este usuario.");
        loadBlogs();
    }).catch((error) => {
        console.error("Error al dejar de seguir al usuario: ", error);
    });
}

// Cargar los blogs de los usuarios seguidos
function loadBlogs() {
    db.collection("users").doc(auth.currentUser.uid).get().then((doc) => {
        const following = doc.data().following || [];
        
        // Filtrar blogs solo de los usuarios seguidos
        db.collection("blogs")
            .where("author", "in", following.concat(auth.currentUser.uid))
            .orderBy("timestamp", "desc")
            .onSnapshot((snapshot) => {
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
    });
}

// Mostrar los usuarios que el usuario sigue
function checkFollowing() {
    followingListDiv.innerHTML = "";
    db.collection("users").doc(auth.currentUser.uid).get().then((doc) => {
        const following = doc.data().following || [];
        following.forEach((userID) => {
            db.collection("users").doc(userID).get().then((userDoc) => {
                const user = userDoc.data();
                followingListDiv.innerHTML += `
                    <div class="following-user">
                        <img src="${user.photoURL}" alt="Foto de perfil" style="width: 40px; height: 40px; border-radius: 50%; margin-right: 10px;">
                        <span>${user.displayName}</span>
                        <button onclick="unfollowUser('${userID}')">Dejar de seguir</button>
                    </div>
                `;
            });
        });
    });
}

// Publicar un blog
publishBtn.addEventListener("click", async () => {
    const content = blogContent.value;
    if (content.trim() === "") return;

    // Subir el blog a Firestore
    await db.collection("blogs").add({
        content,
        author: auth.currentUser.displayName,
        authorPhoto: auth.currentUser.photoURL,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
    });

    // Limpiar el campo del contenido
    blogContent.value = "";
});

// Verificación de Autenticación (Mostrar/Ocultar según el estado)
auth.onAuthStateChanged((user) => {
    if (user) {
        userInfo.innerHTML = `
            <img src="${user.photoURL}" alt="Foto de perfil" style="width: 40px; height: 40px; border-radius: 50%;">
            Bienvenido, ${user.displayName}`;
        loginBtn.style.display = "none";
        logoutBtn.style.display = "inline-block";
        blogForm.style.display = "block";
        loadBlogs();
        checkFollowing();
    } else {
        loginBtn.style.display = "inline-block";
        logoutBtn.style.display = "none";
        blogForm.style.display = "none";
        blogsDiv.innerHTML = "";
    }
});
