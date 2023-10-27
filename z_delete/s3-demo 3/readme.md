## Running locally with .env file

If using process.env for AWS creds:
1. create app/.env
2. populate with export commands from AWS website

These credentials expire after 6 hours.


## Build docker image

Replace `mckaguem/node-s3-demo` with a suitable name 

~~~
docker build . -t mckaguem/node-s3-demo
~~~

## Run docker image

~~~
docker run --rm mckaguem/node-s3-demo
~~~

## Push docker image

~~~
docker login
docker push mckaguem/node-s3-demo
~~~

# Running on AWS

## Create the ec2 instance

- add to ec2SSMCab432 role
- `sudo apt update && sudo apt install awscli docker.io`
- `sudo adduser ubuntu docker`
- log out log in
- `docker pull mckaguem/node-s3-demo`
- `docker run --rm mckaguem/node-s3-demo`
