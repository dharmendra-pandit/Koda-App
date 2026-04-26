import mongoose from "mongoose";

const doubtSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subjectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Subject",
      default: null,   // optional — community tab has no subject picker
    },
    chapterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chapter",
      default: null,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
    },
    description: {
      type: String,
      default: "",    // optional in mobile form
    },
    image: {
      type: String,
      default: "",
    },
    isSolved: {
      type: Boolean,
      default: false,
    },
    solvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    upvotes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

doubtSchema.virtual('replies', {
  ref: 'Reply',
  localField: '_id',
  foreignField: 'doubtId'
});

const Doubt = mongoose.model("Doubt", doubtSchema);
export default Doubt;
