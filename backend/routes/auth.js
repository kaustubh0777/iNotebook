const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var fetchuser=require("../middleware/fetchuser")

const JWT_SECRET = "kaustubhpathak";

// Route 1:CREATE A USER USING : POST "/api/auth/createuser" no login req

router.post(
  "/createuser",
  [
    body("email", "Enter a valid mail").isEmail(),
    body("name").isLength({ min: 3 }),
    body("password").isLength({ min: 5 }),
  ],
  async (req, res) => {
    let success=false;
    //if there are errors ,return the bad req and the errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success,errors: errors.array() });
    }
    //check whether user with the same email exists already
    try {
      let user = await User.findOne({ email: req.body.email });
      console.log(user);
      if (user) {
        return res
          .status(400)
          .json({ success,error: "Sorry a user with this email already exists" });
      }
      const salt = await bcrypt.genSalt(10);
      secPass = await bcrypt.hash(req.body.password, salt);
      // Create a User
      user = await User.create({
        name: req.body.name,
        password: secPass,
        email: req.body.email,
      });
      const data = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(data, JWT_SECRET);
      success=true;
      res.json({ success,authtoken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Some error occured");
    }
  }
);

//Route2: Authenticate A USER USING : POST "/api/auth/login" no login req
router.post(
  "/login",
  [
    body("email", "Enter a valid mail").isEmail(),
    body("password", "Password cannot be blank").exists(),
  ],

  async (req, res) => {
    let success=false;
    // if there are errors return bad request
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res
          .status(400)
          .json({ error: "please login with correct credientials" });
      }
      const passwordCompare = await bcrypt.compare(password, user.password);
      if (!passwordCompare) {
        return res
          .status(400)
          .json({ error: "please login with correct credientials" });
          success=false;
      }
      const payload = {
        user: {
          id: user.id,
        },
      };
      const authtoken = jwt.sign(payload, JWT_SECRET);
      success=true
      res.json({ success,authtoken });
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Interval server error occured");
    }
  }
);
// ROute 3: Get login user details using Post "api/auth/getuser" login req
router.post(
  "/getuser",fetchuser,async (req, res) => {
    try {
      userId = req.user.id; 
      const user = await User.findById(userId).select("-password");
      res.send(user)
    } catch (error) {
      console.error(error.message);
      res.status(500).send("Interval server error occured");
    }
  }
);
module.exports = router;

