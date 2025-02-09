
const { S3Client, ListObjectsV2Command, GetObjectCommand, ListBucketsCommand } = require("@aws-sdk/client-s3");





async function getS3Resources(profile) {
    if (!profile || !profile.credentials) {
        return { success: false, message: "No profile or credentials available." };
    }

    try {
        const s3Client = new S3Client({
            region: profile.region,
            credentials: profile.credentials,
        });

        const listParams = {
            Bucket: profile.bucketName,
        };

        const listCommand = new ListObjectsV2Command(listParams);
        const listResponse = await s3Client.send(listCommand);

        let resources = [];

        if (listResponse.Contents) {
            for (const obj of listResponse.Contents) {
                const getObjectParams = {
                    Bucket: profile.bucketName,
                    Key: obj.Key,
                };

                try {
                    const getObjectCommand = new GetObjectCommand(getObjectParams);
                    const getObjectResponse = await s3Client.send(getObjectCommand);

                    const contentType = getObjectResponse.ContentType;
                    const isImage = contentType && contentType.startsWith('image/');

                    let src;
                    if (isImage) {
                        try {

                            const blob = await getObjectResponse.Body.transformToByteArray();
                            const buffer = Buffer.from(blob);


                            const base64Image = buffer.toString('base64');


                            src = `data:${contentType};base64,${base64Image}`;

                        } catch (blobError) {
                            console.error("Error processing image:", blobError);
                            src = null;
                        }
                    } else {
                        src = null;
                    }

                    resources.push({
                        name: obj.Key,
                        type: isImage ? 'image' : 'file',
                        src: src,
                    });

                } catch (getObjectError) {

                }
            }
        }

        return { success: true, resources };
    } catch (error) {
        console.error("Error in getS3Resources:", error);
        return {success: false, message: error.message};
    }
}
async function listAllBucketsAndContents(profile) {
    if (!profile ||!profile.credentials) {
        return { success: false, message: "No profile or credentials available." };
    }

    try {
        const s3Client = new S3Client({
            region: profile.region,
            credentials: profile.credentials,
        });

        const listBucketsCommand = new ListBucketsCommand({});
        const listBucketsResponse = await s3Client.send(listBucketsCommand);

        let bucketData =[];

        if (listBucketsResponse.Buckets) {
            for (const bucket of listBucketsResponse.Buckets) {
                const bucketName = bucket.Name;
                const contents = await getBucketContents(s3Client, bucketName);
                bucketData.push({ bucketName, contents });
            }
        }

        return { success: true, bucketData };

    } catch (error) {
        console.error("Error listing buckets and contents:", error);
        return { success: false, message: error.message };
    }
}

async function getBucketContents(s3Client, bucketName) {
    const listParams = {
        Bucket: bucketName,
    };

    const listCommand = new ListObjectsV2Command(listParams);
    const listResponse = await s3Client.send(listCommand);

    let contents =[];
    if (listResponse.Contents) {
        for (const obj of listResponse.Contents) {
            contents.push(obj.Key);
        }
    }
    return contents;
}

/**
 * Returns the compliance of the account (credential keys) with the s3 bucket.
 * Returns null upon invalid arguments.
 *
 * @param accessKeyId string
 * @param secretAccessKey string
 * @param sessionToken string
 * @param bucketName string
 * @returns {Promise<{msg: string, compliant: null}|{msg: string, compliance: null}|{msg: string, compliant: boolean}>}
 */
async function getBucketCompliance(accessKeyId, secretAccessKey, sessionToken, bucketName){

    if(!accessKeyId || !secretAccessKey || !sessionToken){
        return {compliance: null, msg: 'Error. Unable to perform compliance check. Misconfigured arguments.'}
    }

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
    }catch(e){
        // Returns the error code upon failure.
        if( e.Code === 'AccessDenied' ) return {msg: 'Access Denied', compliant: false}
        else return {msg: 'Error: ' + e.Code, compliant: null}
    }
}

async function main() {

    /*
        puppy
            accessKeyId: "ASIAVIOZFWO2EJGNQFG3",
            secretAccessKey: "Mq8ptNQ3qXkVT5rocpEU/GJao/QwXYw9I+aR40HC",
            sessionToken: "IQoJb3JpZ2luX2VjEID//////////wEaCXVzLWVhc3QtMiJHMEUCIFUsg3sALDE8WYEvYmaj1c0mj/PKkjyWG97Uk2E2kEdBAiEAhkORuvmTBTIaJLR5D/gnfZ+TCwEEcjh8TKvVip7+tgcqzQQImv//////////ARAAGgwzNjE3Njk1Nzk0NDQiDMWJuoZoyL8DL34kFCqhBIdVZS/m9yOcOC+W3ORT0wSsa1s5vH3PIC3ZWqhKbls3t+WHiLU9m5aGRn6yP26uYXMZoVCW8QQIXDq3Lx8/HFoNUdb0PrJdK5Bc1ErTSKCdkw4AD0I0Fuh7Frj76d/Afif7OYkilEQ+SiNHeK0smRMLRc+Ie/lNeM2/7dl52AnhfHf2OeE+DOXDVulKsFOubNPwxhnMEfyHBOPU+YrIhw14paTWGplgkGyOToTeW6Dsretme1eGs0T65ciUA4mQJTRK88S3MDRHJ8+HAEWoKlN5vKKcbEqx5D9NfKRW+UKn6WW6ZsvCsvfGMpQcENuMmeIcE1KUSzdMPjk/+E80Jt45F3o3NWrVU0FKWYravLGwOhX2jaUvxbvLTH6XCXFqa3qSk2QAXWOSlUzm08KCNMHAr9Mxt/TqWXJtVA/rLP/QlRaYKQF/mJ71orV/jAfcBzN57oHWt9iwSR2zF02aRDe8j8wAePrZ2iqEfhpSRv+8pYuUh3OaQ8PDQO06Tz4yRq+AQLBuVOUXUQIZznLTNks3xNmB447Y+HyhH81K3XO819XXgZQQAzw2jEQZUthC4j8RmybRELN2d5PjFjZYOow+Au0kvjWwsOSD5MLtmsNiqrK8ZT1Rm3UqZ88LM1CKxkKXJHg0kTjzntEbeu/BI3w28fyLi2UoR8YOQihCwpZxpN5FpchDdQRvq0l3DWpSVmUBT43rnr+3Iy2ZFjrxdhF2MLnqn70GOoUCSrrqG6E5Vbyfsj7xZokUBRxeYb0IEAPg9diR/teCJTKLKRRVbePzdtd59zL24J3xyvgBBMuACe+GUG/mglT398Gi51p18RpnvI+wG9ngByv7rcdCWuMV1Azwxo0v4sB+sD4UZqNs0S7ECy8g6Wl+BJbgGhSGzwr4n1ab1SJVilbQhs0ToPvgyUBVyUj+Pw/KOFETr4ouYtZZIjgXcLg1c3orMJgI49x7NcK/MXSrZGuXfvjmqAkO26KNbhbRACjfCQMWCZTp6kwZjjYeYvKZLlC/q2gVuqHeiLdSNSZ9EW9bZXMSrzfYBP1yTTUt7h37RpFWQhwt7N1Lh9KS47qHtjz84yS5"

        canine
            accessKeyId: "ASIAYXWBOFS7XXLWAIQ7",
            secretAccessKey: "qH9mzacHsLK8c/wyV3Fide8Lg7O+j8euGszYs4CN",
            sessionToken: "IQoJb3JpZ2luX2VjEIH//////////wEaCXVzLWVhc3QtMiJIMEYCIQD8A1at64TQ9Z+zzfGVW0VldTLCY6JZFSHotlBIKORbCwIhALRUBFcsOlZWkzT7+bR3zbU77EJ6JQbe/NGl7FP6ybgPKs0ECJr//////////wEQABoMNjAwNjI3MzU4OTExIgwBYOWIIBazYXfsitkqoQTDcW7siPiS/JQyN4/tkvgZcUKbSfiN22+opKv1A6rVab0IVdX0zwb+TTPldFJqDDjNo3ZqKuxuw/nh/kIreJPCPwpt35HoAbetSGrUrWyuqQ35aVItdBFKd+++WoFas+NhLLg8OLU7NQThkgH+Wz6g5GxtyiuNMbt+BpsYqgvMz3xsQEOoQgc6mL5q+0/i7VtyD8cRvk4Z3nXBb4Wu9vdB3cuZK9XEMtfesiOSDmgXFVbSiRyjdw4GEIW5VLuNW1uaBIj16xFingDG90iCQ3j8CAIgs7Z/LCHmt4ciSu0bzXlPQXYEo7DHXOGCGfAgkZZ7EkZuYMoxYPg8GEFW4ErWta7f0Eppri09UlFtVdg2SVt8HEntVF1iluwGLm7CHPr+wFEcAT1MheqNvM25zruCO+4aJrmYrrmhp2iPHi2MBhfrGyRTvDB/g4t8RABQ4PlZDAOjMFztW4Z+kp+LmWhBOIaBJ0KBqkDDaHdLXCd4qFJW9nJPipRvBND0CNaN8ecUObQ4NhoswtAyGR6cKTETru1rMY4d9QZyeWCRL3Z0MkHPI2su1ZHfYiume9QD54E8287yODi/fzA1+c6xH8YBCwg1uZUoLpdq6pYYYrYCvrF+oNe6oTwZi+bXBFlxMEBYWwfRUzCFgyOhYD+C3uigqsiXBMNv3FlK4bYGw18T1Gsb1N0F+iQcm7KjCgGR9azqlnXjR8rXN7qhVurn3NyibzDn8J+9BjqEAo4z+ye7XG5Vz4YV+EvHZt0YD8RLwJm2lwiG1nUhaPjpl9FnBBUbP4FVin5dm90/YtqU8raAv685bsoxsX1UgWqK/LZhr0QZb9yjWm+AXMkj+g+4Hg/Es0nIYtuPHaArozQW71AQLFkTqTrs0Qi4MBYIc24b4cvUiIP9H+GTHB/Kl15QK6ZO16x4paZI2UgKNyEPnCXwj4kDX14QQEbtivCYCLCMBllQy83VpqE0kTuPn7sWxmZdzACj+AVQQwjP+Z05it1e8DsROL+lZQzEVbZ0deNJ7ULU+7LdjvR1+R+tp7n61mf6opdYIZSZlY78ja92A/uRwmdvadBXjg1BaAFvrg+9"

     */

   //test profile
    const testProfile = {
        region: "us-east-2",
        credentials: {
            accessKeyId: "ASIAYXWBOFS7XXLWAIQ7",
            secretAccessKey: "qH9mzacHsLK8c/wyV3Fide8Lg7O+j8euGszYs4CN",
            sessionToken: "IQoJb3JpZ2luX2VjEIH//////////wEaCXVzLWVhc3QtMiJIMEYCIQD8A1at64TQ9Z+zzfGVW0VldTLCY6JZFSHotlBIKORbCwIhALRUBFcsOlZWkzT7+bR3zbU77EJ6JQbe/NGl7FP6ybgPKs0ECJr//////////wEQABoMNjAwNjI3MzU4OTExIgwBYOWIIBazYXfsitkqoQTDcW7siPiS/JQyN4/tkvgZcUKbSfiN22+opKv1A6rVab0IVdX0zwb+TTPldFJqDDjNo3ZqKuxuw/nh/kIreJPCPwpt35HoAbetSGrUrWyuqQ35aVItdBFKd+++WoFas+NhLLg8OLU7NQThkgH+Wz6g5GxtyiuNMbt+BpsYqgvMz3xsQEOoQgc6mL5q+0/i7VtyD8cRvk4Z3nXBb4Wu9vdB3cuZK9XEMtfesiOSDmgXFVbSiRyjdw4GEIW5VLuNW1uaBIj16xFingDG90iCQ3j8CAIgs7Z/LCHmt4ciSu0bzXlPQXYEo7DHXOGCGfAgkZZ7EkZuYMoxYPg8GEFW4ErWta7f0Eppri09UlFtVdg2SVt8HEntVF1iluwGLm7CHPr+wFEcAT1MheqNvM25zruCO+4aJrmYrrmhp2iPHi2MBhfrGyRTvDB/g4t8RABQ4PlZDAOjMFztW4Z+kp+LmWhBOIaBJ0KBqkDDaHdLXCd4qFJW9nJPipRvBND0CNaN8ecUObQ4NhoswtAyGR6cKTETru1rMY4d9QZyeWCRL3Z0MkHPI2su1ZHfYiume9QD54E8287yODi/fzA1+c6xH8YBCwg1uZUoLpdq6pYYYrYCvrF+oNe6oTwZi+bXBFlxMEBYWwfRUzCFgyOhYD+C3uigqsiXBMNv3FlK4bYGw18T1Gsb1N0F+iQcm7KjCgGR9azqlnXjR8rXN7qhVurn3NyibzDn8J+9BjqEAo4z+ye7XG5Vz4YV+EvHZt0YD8RLwJm2lwiG1nUhaPjpl9FnBBUbP4FVin5dm90/YtqU8raAv685bsoxsX1UgWqK/LZhr0QZb9yjWm+AXMkj+g+4Hg/Es0nIYtuPHaArozQW71AQLFkTqTrs0Qi4MBYIc24b4cvUiIP9H+GTHB/Kl15QK6ZO16x4paZI2UgKNyEPnCXwj4kDX14QQEbtivCYCLCMBllQy83VpqE0kTuPn7sWxmZdzACj+AVQQwjP+Z05it1e8DsROL+lZQzEVbZ0deNJ7ULU+7LdjvR1+R+tp7n61mf6opdYIZSZlY78ja92A/uRwmdvadBXjg1BaAFvrg+9"

        },
        bucketName: "puppy-pics-s3"
    };

    try {
        /*
        const result = await listAllBucketsAndContents(testProfile);
        if (result.success) {
            console.log("Bucket Data:", JSON.stringify(result.bucketData, null, 2));
        } else {
            console.error("Error:", result.message);
        }

        const resourcesResult = await getS3Resources(testProfile);
        if (resourcesResult.success) {
            console.log("Resources Data:", JSON.stringify(resourcesResult.resources, null, 2));
        } else {
            console.error("Error:", resourcesResult.message);
        }


         */
        console.log('\nAttempting compliance check...')

        const compliance = await getBucketCompliance(
            testProfile.credentials.accessKeyId,
            testProfile.credentials.secretAccessKey,
            testProfile.credentials.sessionToken,
            'puppy-pics-s3'
        )
        console.log(compliance)
    } catch (error) {
        console.error("Main function error:", error);
    }
}

if (require.main === module) {
    main();
}

module.exports = { getS3Resources };