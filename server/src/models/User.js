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
    role: {
      type: String,
      enum: ["admin", "manager", "member"],
      default: "member",
      required: true,
    },
    department: {
      type: String,
      trim: true,
      default: "Engineering",
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

userSchema.set("toJSON", {
  transform(_doc, ret) {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

export const User = mongoose.models.User || mongoose.model("User", userSchema);
