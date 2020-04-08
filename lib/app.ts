import * as express from "express";
import * as bodyParser from "body-parser";
import {UploadRoutes} from "./routes/uploadRoutes";
import * as mongoose from "mongoose";
import * as  cors from 'cors';

const MongoUrl = "mongodb://localhost:27017/uploadDB";

class app {
    public app: express.Application;
    public uploadRoutes: UploadRoutes = new UploadRoutes();

    constructor() {
        this.app = express();
        this.config();
        this.mongoSetup();
        this.uploadRoutes.UploadRoutes(this.app);
    }

    config() {
        this.app.use(bodyParser.json());
        this.app.use(bodyParser.urlencoded({extended: true}));
        this.app.use(cors())
    }

    private mongoSetup(): void {
        mongoose.connect(MongoUrl, {useNewUrlParser: true, useUnifiedTopology: true});
    }

}

export default new app().app;
