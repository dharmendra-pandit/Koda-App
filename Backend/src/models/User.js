import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
      select: false,
    },
    institution: {
      type: String,
      required: [true, "Institution is required"],
      trim: true,
    },
    year: {
      type: String,
      required: [true, "Year is required"],
    },
    bio: {
      type: String,
      default: "",
      maxlength: 200,
    },
    avatar: {
      type: String,
      default: "",
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
    followers: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    following: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    totalPoints: {
      type: Number,
      default: 0,
    },
    level: {
      type: String,
      default: "Beginner",
      enum: ["Beginner", "Explorer", "Scholar", "Expert", "Master", "Legend"],
    },
    currentStreak: {
      type: Number,
      default: 0,
    },
    longestStreak: {
      type: Number,
      default: 0,
    },
    lastStudyDate: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// Hash password before saving
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare passwords
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Auto update level based on totalPoints
userSchema.methods.updateLevel = function () {
  const points = this.totalPoints;
  if (points >= 5000) this.level = "Legend";
  else if (points >= 2000) this.level = "Master";
  else if (points >= 1000) this.level = "Expert";
  else if (points >= 500) this.level = "Scholar";
  else if (points >= 100) this.level = "Explorer";
  else this.level = "Beginner";
};

const User = mongoose.model("User", userSchema);
export default User;
