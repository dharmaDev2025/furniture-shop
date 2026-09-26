import cloudinary from "../config/cloudinary.js";

export const uploadBill = (
  pdfBuffer: Buffer,
  orderNumber: string
): Promise<string> => {

  return new Promise((resolve, reject) => {

    const uploadStream =
      cloudinary.uploader.upload_stream(
        {
          resource_type: "raw",

          folder: "furniture-shop/bills",

          public_id: `${orderNumber}-bill`,

          overwrite: true,
        },

        (error, result) => {

          if (error) {
            reject(error);
            return;
          }

          if (!result) {
            reject(
              new Error("Bill upload failed")
            );
            return;
          }

          resolve(result.secure_url);
        }
      );

    uploadStream.end(pdfBuffer);
  });
};