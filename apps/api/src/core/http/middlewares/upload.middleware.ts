import multer from "multer";
import { RequestHandler } from "express";
import { BadRequestError } from "@shared/error";
import { ErrorCodes } from "@shared/error/error-codes";

const storage = multer.memoryStorage();

const imageFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        "Invalid image file type",
        undefined,
        ErrorCodes.FILE_INVALID_TYPE,
      ),
    );
  }
};

// Single-image upload — used by the avatar endpoint. `memoryStorage` buffers
// the whole file in RAM, so the 5 MB ceiling doubles as a memory guard.
export const uploadImage: RequestHandler = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
}).single("file") as unknown as RequestHandler;
