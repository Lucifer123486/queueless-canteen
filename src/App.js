import React, { useEffect, useState } from "react";
import Auth from "./components/Auth";
import StudentPanel from "./components/StudentPanel";
import AdminPanel from "./components/AdminPanel";
import { auth, db } from "./firebase";
import { doc, getDoc } from "firebase/firestore";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { AppBar, Toolbar, Typography, Button, Box } from "@mui/material";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        const data = userDoc.data();
        if (data?.role) {
          setUserRole(data.role);
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = () => {
    signOut(auth).then(() => {
      setCurrentUser(null);
      setUserRole(null);
    });
  };

  if (loading) return <p>Loading...</p>;
  if (!currentUser) return <Auth />;

  return (
    <Box>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Trinity Canteen
          </Typography>
          <Button color="inherit" onClick={handleLogout}>
            Logout
          </Button>
        </Toolbar>
      </AppBar>

      {userRole === "admin" ? <AdminPanel /> : <StudentPanel />}
    </Box>
  );
}

export default App;
