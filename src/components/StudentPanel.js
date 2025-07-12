// src/components/StudentPanel.js

import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  serverTimestamp,
  onSnapshot,
  updateDoc,
  increment,
  query,
  where,
} from "firebase/firestore";

import {
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TextField,
  Button,
  Typography,
  Container,
  Alert,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
} from "@mui/material";

export default function StudentPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [menuItems, setMenuItems] = useState([]);
  const [selectedItems, setSelectedItems] = useState({});
  const [pendingOrders, setPendingOrders] = useState([]);
  const [servedOrders, setServedOrders] = useState([]);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [nowServingToken, setNowServingToken] = useState(null);
  const [orderingMode, setOrderingMode] = useState(true);
  const [viewHistory, setViewHistory] = useState(false);

  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [notifiedTokens, setNotifiedTokens] = useState([]);

  // Fetch canteen status
  useEffect(() => {
    const fetchStatus = async () => {
      const docRef = doc(db, "currentStatus", "status");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setIsOpen(docSnap.data().isOpen);
      }
    };
    fetchStatus();
  }, []);

  // Fetch menu items
  useEffect(() => {
    const fetchMenu = async () => {
      const querySnapshot = await getDocs(collection(db, "menuItems"));
      let items = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() });
      });
      setMenuItems(items);
    };
    fetchMenu();
  }, []);

  // Listen to live updates for "Now Serving" token
  useEffect(() => {
    const tokenDocRef = doc(db, "currentToken", "nowServing");
    const unsubscribe = onSnapshot(tokenDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setNowServingToken(docSnap.data().currentTokenNumber);
      }
    });
    return () => unsubscribe();
  }, []);

  // Listen to this student's orders
  useEffect(() => {
    if (!auth.currentUser?.uid) return;

    const q = query(
      collection(db, "tokens"),
      where("studentId", "==", auth.currentUser.uid)
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const studentOrders = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Split into pending and served
      const pending = studentOrders.filter((o) => o.status !== "served");
      const served = studentOrders.filter((o) => o.status === "served");

      setPendingOrders(pending);
      setServedOrders(served);

      // Show notification for newly served orders
      served.forEach((order) => {
        if (!notifiedTokens.includes(order.tokenNumber)) {
          setNotificationMessage(
            `Your order with token #${order.tokenNumber} is ready! Please collect it.`
          );
          setNotificationOpen(true);
          setNotifiedTokens((prev) => [...prev, order.tokenNumber]);
        }
      });
    });

    return () => unsub();
  }, [auth.currentUser?.uid, notifiedTokens]);

  const handleNotificationClose = () => {
    setNotificationOpen(false);
    // After dismissing, remove served orders from pending
    setPendingOrders((prev) => prev.filter((o) => o.status !== "served"));
  };

  const handleQtyChange = (id, qty) => {
    setSelectedItems({
      ...selectedItems,
      [id]: qty,
    });
  };

  const handleSubmitOrder = async () => {
    const itemsToOrder = menuItems
      .filter((item) => (selectedItems[item.id] || 0) > 0)
      .map((item) => ({
        name: item.name,
        qty: selectedItems[item.id] || 0,
        price: item.price,
      }));

    if (itemsToOrder.length === 0) {
      alert("Please select at least one item!");
      return;
    }

    try {
      setPlacingOrder(true);

      const tokenCounterRef = doc(db, "currentToken", "counter");
      const counterSnap = await getDoc(tokenCounterRef);

      let nextTokenNumber = 1;
      let currentSessionId = "default";

      if (counterSnap.exists()) {
        nextTokenNumber = counterSnap.data().lastTokenNumber + 1;
        currentSessionId = counterSnap.data().sessionId || "default";
      }

      const orderData = {
        studentId: auth.currentUser?.uid || "",
        items: itemsToOrder,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
        tokenNumber: nextTokenNumber,
        sessionId: currentSessionId,
        status: "pending",
      };

      await addDoc(collection(db, "tokens"), orderData);

      await updateDoc(tokenCounterRef, {
        lastTokenNumber: increment(1),
      });

      setSelectedItems({});
      setOrderingMode(false);
      setPlacingOrder(false);
    } catch (error) {
      console.error("Error placing order:", error);
      alert("Something went wrong while placing your order.");
      setPlacingOrder(false);
    }
  };

  const handlePlaceNewOrder = () => {
    setSelectedItems({});
    setOrderingMode(true);
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Student Panel
      </Typography>

      <Typography variant="subtitle1" gutterBottom>
        Welcome, {auth.currentUser?.email}
      </Typography>

      <Typography variant="h6" color={isOpen ? "green" : "red"} gutterBottom>
        Canteen Status: {isOpen ? "Open" : "Closed"}
      </Typography>

      {nowServingToken !== null && (
        <Alert severity="info" sx={{ my: 2 }}>
          Now Serving Token #{nowServingToken}
        </Alert>
      )}

      <FormControlLabel
        control={
          <Switch
            checked={viewHistory}
            onChange={() => setViewHistory(!viewHistory)}
          />
        }
        label="View Previous Orders"
      />

      {/* Show pending or served orders */}
      {(viewHistory ? servedOrders : pendingOrders).map((order, index) => (
        <Box
          key={order.id}
          sx={{
            border: "2px dashed",
            borderColor: order.status === "served" ? "green" : "orange",
            background: "#f3fef3",
            p: 4,
            my: 2,
            textAlign: "center",
          }}
        >
          <Typography variant="h6" gutterBottom>
            {viewHistory ? "Previous Order" : "Order"} - Token #
            {order.tokenNumber}
          </Typography>
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle1" gutterBottom>
              Items Ordered:
            </Typography>
            {order.items.map((item, idx) => (
              <Typography key={idx}>
                • {item.name} × {item.qty} = ₹{item.price * item.qty}
              </Typography>
            ))}
            <Typography sx={{ mt: 1, fontWeight: "bold" }}>
              Total: ₹
              {order.items.reduce(
                (total, item) => total + item.price * item.qty,
                0
              )}
            </Typography>
          </Box>
          <Typography sx={{ mt: 2 }}>
            Status:{" "}
            <strong
              style={{
                color: order.status === "served" ? "green" : "orange",
              }}
            >
              {order.status === "served"
                ? "Ready - Collected"
                : "Pending"}
            </strong>
          </Typography>
        </Box>
      ))}

      {isOpen && (
        <>
          {placingOrder ? (
            <Typography sx={{ mt: 2 }}>Placing your order…</Typography>
          ) : orderingMode ? (
            <>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Item</TableCell>
                    <TableCell>Price (₹)</TableCell>
                    <TableCell>Quantity</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {menuItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.price}</TableCell>
                      <TableCell>
                        <TextField
                          type="number"
                          size="small"
                          variant="outlined"
                          value={selectedItems[item.id] || ""}
                          onChange={(e) =>
                            handleQtyChange(
                              item.id,
                              e.target.value === ""
                                ? 0
                                : parseInt(e.target.value) || 0
                            )
                          }
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button
                variant="contained"
                sx={{ mt: 2 }}
                onClick={handleSubmitOrder}
              >
                Submit Order
              </Button>
            </>
          ) : (
            <Button
              variant="outlined"
              sx={{ mt: 3 }}
              onClick={handlePlaceNewOrder}
            >
              Place New Order
            </Button>
          )}
        </>
      )}

      <Dialog open={notificationOpen} onClose={handleNotificationClose}>
        <DialogTitle>Order Ready!</DialogTitle>
        <DialogContent>
          <Typography>{notificationMessage}</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleNotificationClose} variant="contained">
            OK
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
