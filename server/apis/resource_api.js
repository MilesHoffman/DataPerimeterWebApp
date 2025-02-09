const { S3Client, ListObjectsV2Command, GetObjectCommand, ListBucketsCommand, DeleteObjectCommand, PutObjectCommand } = require("@aws-sdk/client-s3")
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

                }
            }
        }

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
    if (!profile || !profile.credentials) {
        return { success: false, message: "No profile or credentials available." }
    }

    if (!bucketName || !objectKey || !fileContent) {
        return { success: false, message: "Bucket name, object key, and file content are required." }
    }

    try {
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
        const presignedUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 })// URL expires in 1 hour


        return { success: true, message: `Object '${objectKey}' uploaded successfully to bucket '${bucketName}'.`, presignedUrl }

    } catch (error) {
        console.error("Error in addS3Resource:", error)
        return { success: false, message: error.message }
    }
}

//main for testing

/*
async function main() {

   //test profile
    const testProfile = {
        region: "us-east-2",
        credentials: {
            accessKeyId: 'ASIAVIOZFWO2GSAC5T6C',
            secretAccessKey:  '6jLa+ZRx5QznN8CF3AH8e6ggZBrfxlYW2pYosLpm',
            sessionToken: 'IQoJb3JpZ2luX2VjEGEaCXVzLWVhc3QtMiJHMEUCIQC2x2GkeCUYZ/HEBTLdX6ZeevEMBQmhTLBGrDmVrxP7vQIgR/KFnSrKKa9S2rW3bR+B0z/ErOyqajUorNXYY/oQo5AqxAQIehAAGgwzNjE3Njk1Nzk0NDQiDCApxk4V8m5lCA0v5SqhBBtGbqP6v4zVQU06Xeg8CA4DKSkbZn5jmuVWXj6GMMYIOHgOdN2cIkiiAZZWOw+ZJwcat0xz08txz7CaqMK26XhYEOUYm1dKOy2vLcNA+EP9KAYW90HWbkkGe5nOs5kxG7cDs3ILFZ8aze9LWkdf9bRfiUJiQPZZXdZthaB1eWGh2HwXIu8yLmo3IJt4uFoYdAUG+khMI8ywe7MpmRKw1f+pRBpIF85vb9KgsuyfkK7n6qb/xCgDSkSOJgqNs/w/XDeRZl9DmrXAx2g3hbrbUkvj7lc76onJoe7lt9qVhL9M7bcInP6c198IrCijH67Mlm0FJWH6YIH2nRFmhto95K7bZT6ixKeyagzJN93jBbAjmXudZ7JDG0PPlJZthYRvOCHXZ0asWOXjeKy+/k27TVdp9VYU6XqocuVYyNaA0RtfJoVUxnAPFZfmDvP88CjjnBsCC4RVzutnaIoPN67xXDonpVzf9RiOw/+bBu2XA21pPSjzTcjQ/dDeKqwGxFMXvS9aHfjhQlb3ffwb+KCuunmQ6DjFG0+ULVZ1gFPxDU9C1EU/Zc0qkOoa1OcEZfEZUqvvYYuDNJiBrW+21gD/GttIyFefLIoLDrQvxdIdkCaGc25nNQj5XiydVo/qt+973nCLAm8xSp0eQKFEHtNE9mNzl52Hf9u1LX9ZOhbEK1YY1Y/7nHLsTuu369YfthslFZLpn7f6K2/n0YS6x1i5kYk5MPWAmb0GOoUCPmhjDweiWb/Bxm4O/54cenuFFF0u0mFtJ8Vaje557+EswFQpMkwDmIlvWxg8doxni5XwJ4NLq43mt1K9o0i9+ug2itjhQc7y1etDrMMXS69U2X+DFevX1XF8lVISSMqDVtLSt8UwsOpPKzpbppSJG8ETeAGB6bTo76IRuXP20cLE+73HgTny4WkqarBjZwg5or0t5Wy/1b6HpS4iWd4qQ8z8oWTXMp+ZRB6y7z2sfS5NVgpml2lmlJVK32Vw8UKpP7DLv5qSiomU0CBFXleor1ZQ67vnCgTuxRRrJ1AohiEL7SOwZjAOIlqDQXlkMC6ZkZH3gCuCrCaa/NTBenwxQsBdAMVB'

},
        bucketName: "puppy-pics-s3"
    }

    try {
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


        /*
        // Test adding a text file
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

        /*
        // Test removing a resource
        const removeResult = await removeS3Resource(testProfile, "puppy-pics-s3", "test.txt"); // Replace with your object key
        if (removeResult.success) {
            console.log(removeResult.message)
        } else {
            console.error("Error:", removeResult.message)
        }



    } catch (error) {
        console.error("Main function error:", error)
    }
}

if (require.main === module) {
    main()
}
*/
module.exports = { getS3Resources,removeS3Resource,addS3Resource }