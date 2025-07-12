// src/components/AdminPanel.js

import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  getDoc,
  setDoc,
  addDoc,
  onSnapshot,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  Container,
  Typography,
  Button,
  Box,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";

export default function AdminPanel() {
  const [tokens, setTokens] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");
  const [message, setMessage] = useState("");
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const docRef = doc(db, "currentStatus", "status");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setIsOpen(docSnap.data().isOpen);
        }
      } catch (error) {
        console.error("Error fetching canteen status:", error);
      }
    };

    fetchStatus();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "tokens"), (snapshot) => {
      const tokensList = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toMillis?.() || Date.now(),
      }));
      setTokens(tokensList);
    });

    return () => unsub();
  }, []);

  useEffect(() => {
    const fetchSessionId = async () => {
      const counterRef = doc(db, "currentToken", "counter");
      const snap = await getDoc(counterRef);
      if (snap.exists()) {
        setSessionId(snap.data().sessionId || "default");
      }
    };
    fetchSessionId();
  }, []);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const querySnap = await getDocs(collection(db, "menuItems"));
      const items = querySnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMenuItems(items);
    } catch (error) {
      console.error("Error fetching menu items:", error);
    }
  };

  const handleToggleCanteen = async () => {
    try {
      const newStatus = !isOpen;
      const docRef = doc(db, "currentStatus", "status");
      await setDoc(docRef, { isOpen: newStatus });
      setIsOpen(newStatus);
      setMessage(`Canteen is now ${newStatus ? "Open" : "Closed"}`);
    } catch (error) {
      console.error("Error updating status:", error);
    }
  };

  const handleAddMenuItem = async () => {
    if (!newItemName || !newItemPrice) {
      setMessage("Please enter item name and price.");
      return;
    }

    try {
      await addDoc(collection(db, "menuItems"), {
        name: newItemName,
        price: parseInt(newItemPrice),
      });
      setMessage(`Item "${newItemName}" added successfully!`);
      setNewItemName("");
      setNewItemPrice("");
      await fetchMenuItems();
    } catch (error) {
      console.error("Error adding menu item:", error);
      setMessage("Error adding menu item.");
    }
  };

  const handleDeleteMenuItem = async (itemId) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      try {
        await deleteDoc(doc(db, "menuItems", itemId));
        setMessage("Menu item deleted successfully!");
        await fetchMenuItems();
      } catch (error) {
        console.error("Error deleting menu item:", error);
        setMessage("Error deleting menu item.");
      }
    }
  };

  const handleMarkServed = async (tokenId) => {
    try {
      const tokenDoc = doc(db, "tokens", tokenId);
      const tokenSnap = await getDoc(tokenDoc);

      if (!tokenSnap.exists()) {
        console.error("Token document not found.");
        return;
      }

      const token = tokenSnap.data();

      await updateDoc(tokenDoc, { status: "served" });

      const nowServingRef = doc(db, "currentToken", "nowServing");
      await setDoc(nowServingRef, {
        currentTokenNumber: token.tokenNumber || tokenId,
      });

      setMessage(`Token ${token.tokenNumber || tokenId} marked as served and now serving updated.`);
    } catch (error) {
      console.error("Error updating token:", error);
    }
  };

  const handleResetTokens = async () => {
    try {
      const newSessionId = Date.now().toString();
      const counterRef = doc(db, "currentToken", "counter");
      await setDoc(counterRef, {
        lastTokenNumber: 0,
        sessionId: newSessionId,
      });
      setSessionId(newSessionId);
      setMessage("Token counter reset. Table will now only show new orders.");
    } catch (error) {
      console.error("Error resetting token counter:", error);
      setMessage("Error resetting token counter.");
    }
  };

  const handleShowAllOrders = () => {
    setSessionId(null);
    setMessage("Showing all orders again.");
  };

  const filteredTokens =
    sessionId != null
      ? tokens.filter((t) => t.sessionId === sessionId)
      : tokens;

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Admin Panel
      </Typography>

      {message && (
        <Alert severity="info" onClose={() => setMessage("")} sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Canteen Status:{" "}
          <span style={{ color: isOpen ? "green" : "red" }}>
            {isOpen ? "Open" : "Closed"}
          </span>
        </Typography>
        <Button
          variant="contained"
          color={isOpen ? "error" : "success"}
          onClick={handleToggleCanteen}
          sx={{ mt: 1 }}
        >
          {isOpen ? "Close" : "Open"} Canteen
        </Button>
      </Paper>

      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Add New Menu Item
        </Typography>
        <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
          <TextField
            label="Item Name"
            value={newItemName}
            onChange={(e) => setNewItemName(e.target.value)}
          />
          <TextField
            label="Price (₹)"
            type="number"
            value={newItemPrice}
            onChange={(e) => setNewItemPrice(e.target.value)}
          />
          <Button variant="contained" color="primary" onClick={handleAddMenuItem}>
            Add
          </Button>
        </Box>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Current Menu:
        </Typography>
        <List dense>
          {menuItems.map((item) => (
            <ListItem
              key={item.id}
              secondaryAction={
                <IconButton
                  edge="end"
                  aria-label="delete"
                  color="error"
                  onClick={() => handleDeleteMenuItem(item.id)}
                >
                  <DeleteIcon />
                </IconButton>
              }
            >
              <ListItemText primary={`${item.name} - ₹${item.price}`} />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="h6">
            All Orders ({filteredTokens.length})
          </Typography>
          <Box>
            <Button
              variant="outlined"
              color="secondary"
              onClick={handleResetTokens}
              sx={{ mr: 2 }}
            >
              Reset Token Counter
            </Button>
            {sessionId && (
              <Button
                variant="contained"
                color="primary"
                onClick={handleShowAllOrders}
              >
                Show All Orders
              </Button>
            )}
          </Box>
        </Box>

        <Table sx={{ mt: 2 }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
              <TableCell>Token No</TableCell>
              <TableCell>Student ID</TableCell>
              <TableCell>Items</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTokens.map((token) => (
              <TableRow key={token.id}>
                <TableCell>{token.tokenNumber || token.id}</TableCell>
                <TableCell>{token.studentId}</TableCell>
                <TableCell>
                  <ul style={{ margin: 0, paddingLeft: "1.2em" }}>
                    {token.items?.map((item, idx) => (
                      <li key={idx}>
                        {item.name} × {item.qty} (₹{item.price})
                      </li>
                    ))}
                  </ul>
                </TableCell>
                <TableCell>
                  {token.status === "served" ? (
                    <Typography color="green">Served</Typography>
                  ) : (
                    "Pending"
                  )}
                </TableCell>
                <TableCell>
                  {token.status !== "served" && (
                    <Button
                      size="small"
                      variant="contained"
                      color="success"
                      onClick={() => handleMarkServed(token.id)}
                    >
                      Mark Served
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
}
