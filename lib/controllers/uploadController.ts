import * as mongoose from 'mongoose';
import {Request, Response} from 'express';
import {exec} from "child_process";
import * as fs from "fs";
import * as _ from "lodash";

export class UploadController {

    public onUpload(req: Request, res: Response) {
        res.status(200).send('done');
    }

    public deleteFile(req: Request, res: Response) {
        const filesTable = mongoose.connection.db.collection('myUploads.files');
        const filesChunks = mongoose.connection.db.collection('myUploads.chunks');
        filesTable.findOneAndDelete({_id: new mongoose.Types.ObjectId(req.params._id)}).then(d => {
            filesChunks.deleteMany({files_id: new mongoose.Types.ObjectId(req.params._id)}).then(c => {
                res.send({res: "File deleted!"});
            }).catch(e => {
                res.send({res: "File not found!"});
            });
        })
            .catch(error => {
                res.send({res: "File not found!"});
            });

    }


    public async loadMyPersonnelFiles(req: Request, res: Response) {
        const collection = mongoose.connection.db.collection('myUploads.files');
        let arr, err;
        arr = await
            collection.find({'metadata.empId': req.params.userId, 'metadata.fileType': 'myFiles'}).toArray();
        res.send(arr);
    }

    public loadImage(req: Request, res: Response) {
        const collection = mongoose.connection.db.collection('myUploads.files');
        const collectionChunks = mongoose.connection.db.collection('myUploads.chunks');
        console.log("====>" + req.params._id);
        collection.find({_id: new mongoose.Types.ObjectId(req.params._id)}).toArray(function (err, docs) {
            if (err) {
                return res.send({title: 'File error', message: 'Error finding file', error: err});
            }
            if (!docs || docs.length === 0) {
                return res.send({title: 'Download Error', message: 'No file found'});
            } else {
                //Retrieving the chunks from the db
                collectionChunks.find({files_id: docs[0]._id}).sort({n: 1}).toArray(function (err, chunks) {
                    if (err) {
                        return res.send({
                            title: 'Download Error',
                            message: 'Error retrieving chunks',
                            error: err.errmsg
                        });
                    }
                    if (!chunks || chunks.length === 0) {
                        //No data found
                        return res.send({title: 'Download Error', message: 'No data found'});
                    }
                    //Append Chunks
                    let fileData = [];
                    for (let i = 0; i < chunks.length; i++) {
                        //This is in Binary JSON or BSON format, which is stored
                        //in fileData array in base64 endocoded string format
                        fileData.push(chunks[i].data.toString('base64'));
                    }
                    //Display the chunks using the data URI format
                    let finalFile = 'data:' + docs[0].contentType + ';base64,' + fileData.join('');
                    res.send({file: finalFile});
                });
            }
        });
        // });
    }

    public async downloadFile(req: Request, res: Response) {
        var gridfsbucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
            bucketName: 'myUploads'
        });
        const collection = mongoose.connection.db.collection('myUploads.files');
        let myFile = await collection.find({_id: new mongoose.Types.ObjectId(req.params._id)}).toArray();
        if (_.isEmpty(myFile)) {
            res.send({error: 'file file not found'});
            return;
        }


        res.setHeader('Content-disposition', 'attachment; filename=' + myFile[0].filename);
        res.setHeader('Content-type', myFile[0].contentType);
        gridfsbucket.openDownloadStream(new mongoose.Types.ObjectId(req.params._id))
            .pipe(res)
            .on('error', () => {
                console.log("Some error occurred in download:");
                res.send({error: 'Some error occurred in download:'});
            })
            .on('finish', () => {
                console.log("done downloading");
            });
    }


}
