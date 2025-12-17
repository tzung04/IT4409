import express from "express";
import mongoose from "mongoose";
import  cors from "cors";


const app = express();
// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
const MONGODB_URI = "mongodb+srv://20225157:20225157@cluster0.yvqyeqe.mongodb.net/?appName=Cluster0";

mongoose.connect(MONGODB_URI)
  .then(() => console.log("Connected to MongoDB Atlas"))
  .catch(err => console.error("MongoDB connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Tên không được để trống'],
    minlength: [2, 'Tên phải có ít nhất 2 ký tự']
  },
  age: {
    type: Number,
    required: [true, 'Tuổi không được để trống'],
    validate: {
      validator: Number.isInteger,
      message: 'Tuổi phải là số nguyên'
    },
    min: [0, 'Tuổi phải >= 0']
  },
  email: {
    type: String,
    required: [true, 'Email không được để trống'],
    unique: true,
    match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
  },
  address: {
    type: String
  }

 
});

const User = mongoose.model("User", userSchema, '20225295');


// Get all users
app.get("/api/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || '';

    const filter = search
    ? {
    $or: [
    { name: { $regex: search, $options: "i" } },
    { email: { $regex: search, $options: "i" } },
    { address: { $regex: search, $options: "i" } }
    ]
    }
    : {};

    // Tính skip
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]);
    // // Query database
    // const users = await User.find(filter)
    // .skip(skip)
    // .limit(limit);

    // // Đếm tổng số documents
    // const total = await User.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    // Trả về response
    res.json({
    page,
    limit,
    total,
    totalPages,
    data: users
    });

  } catch (error) {
    res.status(500).json({
      message: "Error get users",
      error: error.message
    });
  }
});


// Create new user
app.post("/api/users", async (req, res) => {
  try {
    const { name, age, email, address } = req.body;

    // Kiểm tra tuổi là số nguyên
    const ageInt = parseInt(age);
    if (isNaN(ageInt) || !Number.isInteger(ageInt)) {
      return res.status(400).json({
        success: false,
        message: "Tuổi phải là số nguyên"
      });
    }

    if (ageInt < 0) {
      return res.status(400).json({
        success: false,
        message: "Tuổi phải lớn hơn hoặc bằng 0"
      });
    }

    if (!email || !email.trim()) {
      return res.status(400).json({
        success: false,
        message: "Email là bắt buộc"
      });
    }

    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        message: "Email không hợp lệ"
      });
    }


    const newUser = await User.create({
      name,
      age,
      email,
      address
    });

    
    res.status(201).json({
      message: "User created successfully!",
      data: newUser
    });
  } catch (error) {
    res.status(400).json({ error: err.message });
  }
});

// Update user
app.put("/api/users/:id", async (req, res) => {
  try {
    const {id} = req.params;
    const { name, age, email, address } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, age, email, address },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    res.json({
      message: "Cập nhật người dùng thành công",
      data: updatedUser
    });

  } catch (error) {
    res.status(400).json({ error: err.message });
  }
});

// Delete user
app.delete("/api/users/:id", async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    
    if (!deletedUser) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    res.json({
      message: "Xóa người dùng thành công",
      data: deletedUser
    });
  } catch (error) {
    res.status(400).json({ error: err.message });
  }
});


app.listen(3002, () => {
  console.log(`Server is running on port 3002`);
});