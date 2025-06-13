const express = require("express");
const path = require("path");
const db = require("./db");

const app = express();
const port = 3000;

app.use(express.json());

// ✅ Servir archivos estáticos desde /public
app.use(express.static(path.join(__dirname, "..", "public")));

// ✅ Redirigir raíz "/" a login
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// ✅ SPA principal (cliente)
app.get("/WAVAULT/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "client.html"));
});

// ✅ Registro de usuario
app.post("/registro", (req, res) => {
  const { email, password, rol } = req.body;

  if (!email || !password || !rol) {
    return res.status(400).json({ error: "Faltan campos requeridos." });
  }

  db.run(
    `INSERT INTO usuarios (email, password, rol) VALUES (?, ?, ?)`,
    [email, password, rol],
    function (err) {
      if (err) return res.status(400).json({ error: err.message });
      res.status(201).json({ id: this.lastID });
    }
  );
});

// ✅ Inicio de sesión
app.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Correo y contraseña son requeridos." });
  }

  db.get(
    `SELECT * FROM usuarios WHERE email = ? AND password = ?`,
    [email, password],
    (err, row) => {
      if (err) return res.status(500).json({ error: "Error del servidor." });
      if (!row) return res.status(401).json({ error: "Credenciales inválidas." });

      res.json({
        id: row.id,
        email: row.email,
        rol: row.rol
      });
    }
  );
});

// ✅ Subir nuevo beat
app.post("/subir-beat", (req, res) => {
  console.log("📥 /subir-beat body:", req.body);

  const { titulo, precio, archivo, productor_email } = req.body;

  if (!titulo || !precio || !archivo || !productor_email) {
    console.log("❌ Campos incompletos");
    return res.status(400).json({ error: "Faltan campos requeridos." });
  }

  // Obtener el ID del productor a partir del email
  db.get(
    `SELECT id FROM usuarios WHERE email = ? AND rol = 'productor'`,
    [productor_email],
    (err, row) => {
      if (err) {
        console.error("❌ Error al buscar productor:", err.message);
        return res.status(500).json({ error: "Error al buscar productor." });
      }

      if (!row) {
        return res.status(404).json({ error: "Productor no encontrado." });
      }

      const productor_id = row.id;

      db.run(
        `INSERT INTO beats (titulo, precio, archivo, productor_id) VALUES (?, ?, ?, ?)`,
        [titulo, precio, archivo, productor_id],
        function (err) {
          if (err) {
            console.error("❌ Error al insertar beat:", err.message);
            return res.status(500).json({ error: "Error al guardar el beat." });
          }

          console.log("✅ Beat insertado con ID:", this.lastID);
          res.status(201).json({ id: this.lastID });
        }
      );
    }
  );
});

// ✅ Obtener todos los beats con nombre de productor
app.get("/beats", (req, res) => {
  db.all(
    `SELECT beats.id, beats.titulo, beats.precio, beats.archivo, usuarios.email AS productor_email
     FROM beats
     JOIN usuarios ON beats.productor_id = usuarios.id`,
    [],
    (err, rows) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(rows);
    }
  );
});

// 🔁 Ruta 404 si no se encuentra la petición
app.use((req, res) => {
  res.status(404).send("Página no encontrada");
});

// ✅ Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
