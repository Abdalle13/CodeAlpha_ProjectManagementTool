import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    systemRole: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    role: {
      type: String,
      enum: ["admin", "manager", "member", "user"],
      default: "user",
      required: true,
    },
    title: {
      type: String,
      trim: true,
      default: "Software Engineer",
    },
    avatarColor: {
      type: String,
      default: "#3b82f6",
    },
    resetPasswordToken: {
      type: String,
      select: false,
    },
    resetPasswordExpires: {
      type: Date,
      select: false,
    },
    isActive: {
      type: Boolean,
      default: true,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", function (next) {
  if (this.isModified("systemRole") && !this.isModified("role")) {
    this.role = this.systemRole === "admin" ? "admin" : "user";
  } else if (this.isModified("role") && !this.isModified("systemRole")) {
    this.systemRole = this.role === "admin" ? "admin" : "user";
  }
  next();
});

userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
