// ================= GOOGLE LOGIN =================
router.post("/google-login", async (req, res) => {

  const { email } = req.body;

  try {
    // 1️⃣ Check user in users + employees table
    const [users] = await db.query(
      `SELECT users.email, employees.name
       FROM users
       JOIN employees ON users.email = employees.email
       WHERE users.email = ?`,
      [email]
    );

    // 2️⃣ If not found
    if (users.length === 0) {
      return res.status(401).json({
        message: "User not registered. Contact admin.",
      });
    }

    // 3️⃣ Success
    const user = users[0];

    res.json({
      message: "Google login successful",
      user: {
        email: user.email,
        name: user.name,
      },
    });

  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
