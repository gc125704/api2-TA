var express = require('express');
var router = express.Router();
const User = require('../models/User');

/* GET users listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

router.post("/", async (req,res) => {
  const{name,email,password} = req.body;
  const user = new User(req.body);


  res.status(201).json({name,email,password});
});

module.exports = router;
