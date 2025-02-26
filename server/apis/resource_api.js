const { S3Client, ListObjectsV2Command, GetObjectCommand, ListBucketsCommand, DeleteObjectCommand, PutObjectCommand, GetBucketPolicyCommand } = require("@aws-sdk/client-s3")
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner")




async function getS3Resources(profile) {
    if (!profile || !profile.credentials) {
        return { success: false, message: "No profile or credentials available." }
    }

    try {
        const s3Client = new S3Client({
            region: profile.region,
            credentials: profile.credentials,
        })

        const listParams = {
            Bucket: profile.bucketName,
        }

        const listCommand = new ListObjectsV2Command(listParams)
        const listResponse = await s3Client.send(listCommand)

        let resources = []

        if (listResponse.Contents) {
            for (const obj of listResponse.Contents) {
                const getObjectParams = {
                    Bucket: profile.bucketName,
                    Key: obj.Key,
                }

                try {
                    const getObjectCommand = new GetObjectCommand(getObjectParams);
                    const getObjectResponse = await s3Client.send(getObjectCommand);

                    const contentType = getObjectResponse.ContentType;
                    const isImage = contentType && contentType.startsWith('image/');

                    let src;
                    if (isImage) {
                        try {

                            const blob = await getObjectResponse.Body.transformToByteArray()
                            const buffer = Buffer.from(blob)


                            const base64Image = buffer.toString('base64')


                            src = `data:${contentType};base64,${base64Image}`

                        } catch (blobError) {
                            console.error("Error processing image:", blobError)
                            src = null;
                        }
                    } else {
                        src = null;
                    }

                    resources.push({
                        name: obj.Key,
                        type: isImage ? 'image' : 'file',
                        src: src,
                    })

                } catch (getObjectError) {
                    console.log('Error in sub-getS3Resources: \n', getObjectError)
                }
            }
        }

        console.log('resources: ', resources.length)

        return { success: true, resources }
    } catch (error) {
        console.error("Error in getS3Resources:", error)
        return {success: false, message: error.message}
    }
}
async function listAllBucketsAndContents(profile) {
    if (!profile ||!profile.credentials) {
        return { success: false, message: "No profile or credentials available." }
    }

    try {
        const s3Client = new S3Client({
            region: profile.region,
            credentials: profile.credentials,
        })

        const listBucketsCommand = new ListBucketsCommand({})
        const listBucketsResponse = await s3Client.send(listBucketsCommand)

        let bucketData =[]

        if (listBucketsResponse.Buckets) {
            for (const bucket of listBucketsResponse.Buckets) {
                const bucketName = bucket.Name
                const contents = await getBucketContents(s3Client, bucketName)
                bucketData.push({ bucketName, contents })
            }
        }

        return { success: true, bucketData }

    } catch (error) {
        console.error("Error listing buckets and contents:", error)
        return { success: false, message: error.message }
    }
}

async function getBucketContents(s3Client, bucketName) {
    const listParams = {
        Bucket: bucketName,
    }

    const listCommand = new ListObjectsV2Command(listParams);
    const listResponse = await s3Client.send(listCommand);

    let contents =[]
    if (listResponse.Contents) {
        for (const obj of listResponse.Contents) {
            contents.push(obj.Key)
        }
    }
    return contents
}


async function removeS3Resource(profile, bucketName, objectName) {
    if (!profile || !profile.credentials) {
        return { success: false, message: "No profile or credentials available." }
    }

    if (!bucketName || !objectName) {
        return { success: false, message: "Bucket name and object key are required." }
    }

    try {
        const s3Client = new S3Client({
            region: profile.region,
            credentials: profile.credentials,
        })

        const deleteParams = {
            Bucket: bucketName,
            Key: objectName,
        }

        const deleteCommand = new DeleteObjectCommand(deleteParams)
        await s3Client.send(deleteCommand)

        return { success: true, message: `Object '${objectName}' deleted successfully from bucket '${bucketName}'.` }

    } catch (error) {
        console.error("Error in removeS3Resource:", error)
        return { success: false, message: error.message }
    }
}

async function addS3Resource(profile, bucketName, objectKey, fileContent, contentType) {
    try {
        console.log("Inside addS3Resource:");
        console.log("  profile:", profile);
        console.log("  bucketName:", bucketName);
        console.log("  objectKey:", objectKey);
        console.log("  contentType:", contentType);
        console.log("  fileContent type:", typeof fileContent, fileContent instanceof Buffer); // CRITICAL check

        const s3Client = new S3Client({
            region: profile.region,
            credentials: profile.credentials,
        })

        const putParams = {
            Bucket: bucketName,
            Key: objectKey,
            Body: fileContent,
            ContentType: contentType,
        }

        const putCommand = new PutObjectCommand(putParams)
        await s3Client.send(putCommand)

        const getObjectParams = {
            Bucket: bucketName,
            Key: objectKey,
        }
        const getCommand = new GetObjectCommand(getObjectParams)
        const presignedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 })


        return { success: true, message: `Object '${objectKey}' uploaded successfully to bucket '${bucketName}'.`, presignedUrl }

    } catch (error) {
        console.error("Error in addS3Resource:", error)
        return { success: false, message: error.message }
    }
}

async function getProfileCompliance(accessKeyId, secretAccessKey, sessionToken, bucketName) {


    const credentials = {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey,
        sessionToken: sessionToken
    }

    try{

        const s3Client = new S3Client({
            region: 'us-east-2',
            credentials: credentials
        })

        const response = await getBucketContents(s3Client, bucketName);

        if(response) return {msg: 'Access Granted', compliant: true}
        else return {msg: 'Access Denied', compliant: false}
    }catch(e){
        // Returns the error code upon failure.
        if( e.Code === 'AccessDenied' ) return {msg: 'Access Denied', compliant: false}
        else return {msg: 'Error: ' + e.Code, compliant: false}
    }
}

// Sends an object to another bucket
async function sendS3Resource(accessKeyId, secretAccessKey, sessionToken, sourceBucketName, destinationBucketName, objectName, objectType) {

    try {
        console.log(`...attempting to send ${objectName}`)
        const credentials = { accessKeyId, secretAccessKey, sessionToken };

        const region = "us-east-2";

        const s3Client = new S3Client({
            region: region,
            credentials: credentials,
        });

        const getParams = {
            Bucket: sourceBucketName,
            Key: objectName,
        };

        const getCommand = new GetObjectCommand(getParams);
        const getResponse = await s3Client.send(getCommand);

        let fileContent;
        let contentType;

        if (objectType === 'image') {

            const stream = getResponse.Body;
            const chunks = [];
            for await (const chunk of stream) {
                chunks.push(chunk);
            }
            const buffer = Buffer.concat(chunks);

            contentType = getResponse.ContentType;

            fileContent = buffer;

        } else {
            console.log("Object type is not supported for transfer for now")
            return {success: false }
        }


        const putParams = {
            Bucket: destinationBucketName,
            Key: objectName,
            Body: fileContent,
            ContentType: contentType,
        };

        const putCommand = new PutObjectCommand(putParams);
        await s3Client.send(putCommand);

        console.log(`Object '${objectName}' sent from '${sourceBucketName}' to '${destinationBucketName}'.`)
        return { success: true };

    } catch (error) {
        console.error("Error in sendS3Resource:", error);
        return { success: false, message: error.message };
    }
}


async function main() {

	const credentials = {
		accessKeyId: "ASIAYXWBOFS7XXLWAIQ7",
		secretAccessKey: "qH9mzacHsLK8c/wyV3Fide8Lg7O+j8euGszYs4CN",
		sessionToken: "IQoJb3JpZ2luX2VjEIH//////////wEaCXVzLWVhc3QtMiJIMEYCIQD8A1at64TQ9Z+zzfGVW0VldTLCY6JZFSHotlBIKORbCwIhALRUBFcsOlZWkzT7+bR3zbU77EJ6JQbe/NGl7FP6ybgPKs0ECJr//////////wEQABoMNjAwNjI3MzU4OTExIgwBYOWIIBazYXfsitkqoQTDcW7siPiS/JQyN4/tkvgZcUKbSfiN22+opKv1A6rVab0IVdX0zwb+TTPldFJqDDjNo3ZqKuxuw/nh/kIreJPCPwpt35HoAbetSGrUrWyuqQ35aVItdBFKd+++WoFas+NhLLg8OLU7NQThkgH+Wz6g5GxtyiuNMbt+BpsYqgvMz3xsQEOoQgc6mL5q+0/i7VtyD8cRvk4Z3nXBb4Wu9vdB3cuZK9XEMtfesiOSDmgXFVbSiRyjdw4GEIW5VLuNW1uaBIj16xFingDG90iCQ3j8CAIgs7Z/LCHmt4ciSu0bzXlPQXYEo7DHXOGCGfAgkZZ7EkZuYMoxYPg8GEFW4ErWta7f0Eppri09UlFtVdg2SVt8HEntVF1iluwGLm7CHPr+wFEcAT1MheqNvM25zruCO+4aJrmYrrmhp2iPHi2MBhfrGyRTvDB/g4t8RABQ4PlZDAOjMFztW4Z+kp+LmWhBOIaBJ0KBqkDDaHdLXCd4qFJW9nJPipRvBND0CNaN8ecUObQ4NhoswtAyGR6cKTETru1rMY4d9QZyeWCRL3Z0MkHPI2su1ZHfYiume9QD54E8287yODi/fzA1+c6xH8YBCwg1uZUoLpdq6pYYYrYCvrF+oNe6oTwZi+bXBFlxMEBYWwfRUzCFgyOhYD+C3uigqsiXBMNv3FlK4bYGw18T1Gsb1N0F+iQcm7KjCgGR9azqlnXjR8rXN7qhVurn3NyibzDn8J+9BjqEAo4z+ye7XG5Vz4YV+EvHZt0YD8RLwJm2lwiG1nUhaPjpl9FnBBUbP4FVin5dm90/YtqU8raAv685bsoxsX1UgWqK/LZhr0QZb9yjWm+AXMkj+g+4Hg/Es0nIYtuPHaArozQW71AQLFkTqTrs0Qi4MBYIc24b4cvUiIP9H+GTHB/Kl15QK6ZO16x4paZI2UgKNyEPnCXwj4kDX14QQEbtivCYCLCMBllQy83VpqE0kTuPn7sWxmZdzACj+AVQQwjP+Z05it1e8DsROL+lZQzEVbZ0deNJ7ULU+7LdjvR1+R+tp7n61mf6opdYIZSZlY78ja92A/uRwmdvadBXjg1BaAFvrg+9"

	}

    //test profile
    const testProfile = {
        region: "us-east-2",

        credentials: credentials,
        bucketName: "puppy-pics-s3"
    }

    try {
		/*
        // List buckets and contents
        const result = await listAllBucketsAndContents(testProfile)

        if (result.success) {
            console.log("Bucket Data:", JSON.stringify(result.bucketData, null, 2))
        } else {
            console.error("Error:", result.message);
        }

        // Get resources in a bucket
        const resourcesResult = await getS3Resources(testProfile);
        if (resourcesResult.success) {
            console.log("Resources Data:", JSON.stringify(resourcesResult.resources, null, 2))
        } else {
            console.error("Error:", resourcesResult.message)
        }

        // Tes adding a text file
        const addTextResult = await addS3Resource(
            testProfile,
            "puppy-pics-s3",
            "test.txt",          // Object key (file name)
            "This is a test text file.",  // File content
            "text/plain"      // MIME type for text files
        );
        if (addTextResult.success) {
            console.log(addTextResult.message);
            console.log("Presigned URL:", addTextResult.presignedUrl);
        } else {
            console.error("Error adding text file:", addTextResult.message)
        }


        // Test adding an image (you'll need to provide the actual image data)
        const imagePath = 'C:\\Users\\Brayden\\Downloads\\testImage5.jpg'
        const imageBuffer = require('fs').readFileSync(imagePath)
        const addImageResult = await addS3Resource(
            testProfile,
            "puppy-pics-s3",      // Your bucket
            "testImage5.jpg",  // Object key
            imageBuffer,      // Image data (as a Buffer)
            "image/jpg"      // MIME type (image/jpeg, image/gif, etc.)
        )
        if (addImageResult.success) {
            console.log(addImageResult.message)
            console.log("Presigned URL:", addImageResult.presignedUrl)
        } else {
            console.error("Error adding image file:", addImageResult.message)
        }


        // Test removing a resource
        const removeResult = await removeS3Resource(testProfile, "puppy-pics-s3", "test.txt"); // Replace with your object key
        if (removeResult.success) {
            console.log(removeResult.message)
        } else {
            console.error("Error:", removeResult.message)
        }

        console.log('\nAttempting compliance check...')

        const compliance = await getBucketCompliance(
            testProfile.credentials.accessKeyId,
            testProfile.credentials.secretAccessKey,
            testProfile.credentials.sessionToken,
            'puppy-pics-s3'
        )
        console.log(compliance)


	    const response = sendS3Resource(
			credentials.accessKeyId, credentials.secretAccessKey, credentials.sessionToken,
		    'org-manager-bucket',
	    )

		 */

    } catch (error) {
        console.error("Main function error:", error)
    }
}

if (require.main === module) {
    main()
}

module.exports = { getS3Resources,removeS3Resource,addS3Resource, getProfileCompliance, sendS3Resource }