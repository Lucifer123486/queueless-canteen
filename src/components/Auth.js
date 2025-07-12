// src/components/Auth.js

import React, { useState } from "react";
import { auth, db } from "../firebase";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { setDoc, doc } from "firebase/firestore";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
} from "@mui/material";

export default function Auth() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [isLogin, setIsLogin] = useState(true);

  const handleSubmit = async () => {
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        const userCred = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );
        await setDoc(doc(db, "users", userCred.user.uid), {
          email,
          role,
        });
      }
    } catch (error) {
      alert(error.message);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <Card sx={{ width: 400, padding: 3 }}>
        <CardContent>
          <Typography
            variant="h4"
            align="center"
            sx={{ fontWeight: "bold", marginBottom: 2, color: "#1976d2" }}
          >
            Trinity Canteen
          </Typography>

          <Typography
            variant="h6"
            align="center"
            sx={{ marginBottom: 2 }}
          >
            {isLogin ? "Login" : "Register"}
          </Typography>

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            margin="normal"
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            fullWidth
            margin="normal"
          />

          {!isLogin && (
            <Box sx={{ marginTop: 2 }}>
              <Typography variant="body1" sx={{ marginBottom: 1 }}>
                Select Role:
              </Typography>
              <RadioGroup
                row
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <FormControlLabel
                  value="student"
                  control={<Radio />}
                  label="Student"
                />
                <FormControlLabel
                  value="admin"
                  control={<Radio />}
                  label="Admin"
                />
              </RadioGroup>
            </Box>
          )}

          <Button
            variant="contained"
            fullWidth
            sx={{ marginTop: 3 }}
            onClick={handleSubmit}
          >
            {isLogin ? "Login" : "Register"}
          </Button>

          <Button
            variant="text"
            fullWidth
            sx={{ marginTop: 1 }}
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? "Switch to Register" : "Switch to Login"}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}
