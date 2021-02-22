## Author: Yoann Julliard <br> Date: 20210211

# Configuring your experiment using Github, Netlify, and Firebases
s
## Context
This file describe how to deploy your experiment using Github, Netlify, and Firebase.
- <b>Github Desktop</b> is a version-control tool that you will use as an interface between your computer and the internet (see [github.com](github.com)).
- <b>Netlify</b> will host your website (i.e., your experiment), this tool is made to work with Github (see [netlify.com](netlify.com)).
- <b>Firebase</b> is our (realtime) database, this is where participants' data will be stored (see [firebase.google.com](firebase.google.com)).

I expect you to use jsPsych (see [jspsych.org](jspsych.org)) to code your experiment. This file does not describe how to code the jsPsych part of your experiment. I also expect that you have folder containing all the necessary files for your experiment to run, including a `index.html` file

## Github Desktop
Create a Github account if necessary at [github.com](github.com).
<br>Then, go to [desktop.github.com](https://desktop.github.com) and download Github Desktop.
<br>Open Github Desktop, click `Create a new repository`, Name it, give it a quick description, choose the local path to the folder containing your files (NB: the `index.html` have to be at the root of this folder). Give it also a license if you want to.
<br>Click `Create repository` and then click `Publish repository`.

Once you published your repository, you will have to push your modifications on Github using Github Desktop. All you have to do is to open Github Desktop, give a very quick summary and description of your modifications, and push the modification on Github.

## Netlify
Create a Netlify account if necessary at [netlify.com](netlify.com).
<br>Then, click `New site from Git`, click the `GitHub` button, and authorize Netlify to access your Github account.
<br>Select the Github repository of your experiment that you just created. Leave everything as default and click `Deploy site`.

Now, click on `Site settings`, change your site name by clicking the `Change site name` button, give it a meaningful name.
<br> Your website (i.e., experiment) should now be online, the url of your website should be something like `your-meaningful-name.netlify.app`.

Once this is done, you should not need to go back on Netlify, the website will be update each time you push a modification on Github.

## Firebase realtime database
Go to [firebase.google.com](firebase.google.com) and log-in using your gmail account.
<br>Create a new project and name it.
<br>Then, click on `Realtime Database` and `Create a database`.
<br>Select `Start in locked mode` and `Activate`.
<br>Click on `Rules`, set `".read" :` and `".write" :` as `true` and publish the modifications.
<br>You can ignore the warning, the database will not be secure but it is not a big deal for us.

Now, Click on `Data` and copy the link `https://project_name.firebaseio.com/`.
<br>Open your experiment script and paste this address in `DatabaseURL: ""`.
<br>To get the API key, go to [https://console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials) where your API key is available under `API Key` and `Key`, copy the API key.
<br>Last step, paste the API key in your experiment script in `apiKey: ""`.

## Contacting me
Your experiment should run now, if you encounter an issue, contact me at [yoannjulliard38@gmail.com](yoannjulliard38@gmail.com), I can try to help.
<br>If you upgrade this file, do not hesitate to send me your upgraded version, I will be glad to see (and maybe adopt) it.
