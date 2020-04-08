import {UploadController} from "../controllers/uploadController";
import * as mongoose from "mongoose";
import * as gridfsStorage from "multer-gridfs-storage";

const crypto = require("crypto");
const path = require("path");
import * as multer from "multer";

const MongoUrl = "mongodb://localhost:27017/uploadDB";

const storage = new gridfsStorage({
    url: MongoUrl,
    file: (req, file) => {
        return {
            bucketName: 'myUploads',       //Setting collection name, default name is fs
            filename: file.originalname,
            metadata: {
                empId: req['body'].userId,
                folderId: req['body'].folder,
                fileType: req['body'].fileType,
                contentType: file.mimetype,
                fileSize: file.size
            }
        }
    }
});
const upload = multer({storage: storage});
const sUpload = upload.single('file');

export class UploadRoutes {
    public uploadController: UploadController = new UploadController();

    public UploadRoutes(app): void {
        app.route('/upload').post(sUpload, this.uploadController.onUpload);
        app.route('/getMyPersonnelFiles/:userId').get(this.uploadController.loadMyPersonnelFiles);
        app.route('/getFile/:_id').get(this.uploadController.downloadFile);
    }
}
