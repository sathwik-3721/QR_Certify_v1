// import logger from "../../../../../logger.js";
// import Qr from "../models/qr.model.js";
import Qr from "../models/qr.model.js";
import { StatusCodes } from "http-status-codes";
import nodemailer from "nodemailer";
import multer from "multer";
import dotenv from "dotenv";
dotenv.config();

const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 512 },
});

// Middleware to handle file uploads
export const uploadData = async (req, res) => {
  try {
      const { name, email,event,image } = req.body; // Get name and email from body
      const result = await Qr.findOne({ name, email, event });
      if(result){
        throw {status : StatusCodes.CONFLICT , message : "User already exists"}
      }
      const newQr = new Qr({
        name,
        email,
        event,
        image,
      });

      await newQr.save(); // Save the document to MongoDB
      return res.status(StatusCodes.OK).send({ message: 'Data uploaded successfully', newQr });
  } catch (error) {
      console.error("An error occurred in uploadData function:", error);
      if (error.status) {
          res.status(error.status).send(error.message);
      } else {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("An error occurred");
      }
  }
}

const updateCertificateStatus = async (name,email,event) => {
  try{
    const response = await Qr.updateOne({name,email,event}, {$set : {issued : true}});

      // Check if the update was successful
      if (response.matchedCount === 0) {
        throw {
          status: 404, // Not Found
          message: 'No matching document found.',
        };
      }
  
      if (response.modifiedCount === 0) {
        throw {
          status: 204, // No Content (document found but no changes made)
          message: 'Document found but no update made.',
        };
      }
  
      return {
        status: 200, // OK
        message: 'Certificate status updated successfully.',
      };
    } catch (err) {
      // Catch any errors that occurred during the update
      throw {
        status: 500, // Internal Server Error
        message: 'An error occurred while updating the certificate status.',
        error: err.message,
      };
    }

}

export const sendCertificate = [
  upload.single("pdf"),
  async (req,res) => {
    try{
      const {name,email,event} = req.body;
    console.log(email);
    const pdfBuffer = req.file.buffer; // Access the uploaded PDF file in memory
    const fileName = req.file.originalname; // Get the original filename

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Thank You Email</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; margin: 0;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: auto; background-color: #ffffff; border: 1px solid #dddddd; border-radius: 8px;">
    <!-- Header -->
    <tr>
      <td style="background-color: #00aae7; padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Thank You for Participating!</h1>
      </td>
    </tr>

    <!-- Body -->
    <tr>
      <td style="padding: 20px;">
        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Dear ${name},
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          We would like to extend our sincere thanks for your participation in ${event}. Your engagement and enthusiasm contributed significantly to the success of the event.
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          As a token of our appreciation, we are pleased to attach your participation certificate. Please find it attached to this email.
        </p>
        <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          We hope to see you again at future events. If you have any feedback or suggestions, feel free to reach out to us.
        </p>
      </td>
    </tr>

    <!-- Footer -->
    <tr>
      <td style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 14px; color: #777777;">
        <p style="margin: 0;">© 2024 Miracle Software Systems, Inc. All Rights Reserved.</p>
      </td>
    </tr>
  </table>
</body>
</html>
`
    const mailDetails = {
        from: process.env.APP_MAIL_USER,
        to: email,
        subject: "Participation Certificate",
        html,
        attachments: [
            {
              filename: fileName, // Name the file
              content:pdfBuffer
            }
          ]
    };

    const mailTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.APP_MAIL_USER,
            pass: process.env.APP_MAIL_PASSWORD
        }
    })
    console.log("mail sent",email)

    mailTransporter.sendMail(mailDetails, async function(err, data) {
        if(err) {
            console.log('Error Occurs',err);
            return res.status(StatusCodes.CONFLICT).send("could not send mail")
        } else {
            console.log('Email sent successfully');
            await updateCertificateStatus(name,email,event);
            return res.status(StatusCodes.OK).send("Send mail successfully")
        }
    });

    }
    catch(error){
      console.error("An error occurred in uploadData function:", error);
        if (error.status) {
            res.status(error.status).send(error.message);
        } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("An error occurred");
        }
    }
    
}
]

export async function getDetails(req, res) {
  try {
      const { name, email,event } = req.query;
      const result = await Qr.findOne({ name, email, event });
      // console.log(result)
      return res.status(200).send(result)

  } catch(error) {
      console.error("An error occurred in uploadData function:", error);
      if (error.status) {
          return res.status(error.status).send(error.message);
      } else {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).send("An error occurred");
      }
  }
}

export async function test(_req, res) {
  return res.status(StatusCodes.OK).send("test successfully");
}
