
NASA Solutions Mechanism Guide Port

===============

## Application Technologies

-	IIS
-	IISnode https://github.com/tjanczuk/iisnode 
-	Node.js http://nodejs.org/
-	Postman
-	Git
-	MySQL

## Application Setup

We assume that IIS is already available on your server. If that is not the case, then follow the instructions at: http://www.iis.net/learn/get-started/whats-new-in-iis-8/installing-iis-8-on-windows-server-2012 

Install latest version of iisnode from https://github.com/tjanczuk/iisnode. Follow their instructions to install node (Read the sections called “Prerequisites for using” and “Installing for IIS*”

Install MySQL from http://dev.mysql.com/downloads/ 

Install Graphic Magic from http://www.graphicsmagick.org/download.html  
Add it to your system PATH (you can check this option during installation)  
Run ``gm`` in command line and verify it works  
Restart IIS run ``iisreset``

## Configurations

Configuration is done at the web.config file. If you open it, there will be a section called “appSettings”. In that section you can find the following options:

- DB_HOST :	The host for MySQL server.	(i.e. localhost)
- DB_NAME :	The MySQL database name. 	(i.e. nasa-smg)
- DB_PORT	: The port for MySQL server.	(default 3306)
- DB_USER	: The username to login to MySQL.	(default root)
- DB_PASSWORD : The password to mysql server.	(default empty password )
- RESET_TABLES : The flag if recreate database. It will drop and create again all tables. Test data is not inserted. Tables will be reset each time you run node app.	false
- DOWNLOADS_DIR	: The path to directory where files are downloaded. default to <app folder>/downloads.

Application is restarted every time you edit web.config.

## Database setup

You must create only empty database in mysql server. Default database name is nasa-smg. Application will create all required tables.

##	Deployment Instructions

### Github Code

1. Checkout the code from this repository under 'www' folder of nodeiis installation (i.e. C:/Program Files/nodeiis/www/nasa-smg)
2. On terminal, navigate to the code folder
3. run "npm install"

###	 IIS configuration

* Setup configuration nasa-smg/web.config file if needed. See section 4.
* We have to be able to override configuration sections and to use URL authorization. Therefore we need to be sure that they are installed on IIS :
  * For windows server 2012
    * Click "Start button"
    * In the search box, enter "Turn windows features on or off". Click on settings under the search box if nothing is displayed.
    * In the features window, Click: "Internet Information Services"
    * Click: "World Wide Web Services"
    * Click: "Application Development Features"
    * Check (enable) the features. You can check all, or leave out CGI.
    * Click: "Security"
    * Check (enable) the URL Authorization feature.
    * Click "Next" until finish.
  * For windows server 2008
    * Go to the control panel
    * In the search box, enter "Turn windows features on or off".
    * The server manager will open.
    * Go to the roles section
    * Go to the Web Server (IIS) section
    * Look for the Role Services subsection
    * Click: "Application Development Features"
    * Install all the services (you can leave out CGI).
    * Click: "Security"
    * Install the URL Authorization feature.
* Install rewrite module http://www.iis.net/downloads/microsoft/url-rewrite
* Now we have to enable the override of the configuration sections.
  * Open the applicationHost.config file, located here: %windir%\system32\inetsrv\config\applicationHost.config
  * Edit the "handlers" section.
  * Change this line:
       ``<section name="handlers" overrideModeDefault="Deny" />``

    To:
       ``<section name="handlers" overrideModeDefault="Allow" />``

  * Edit the "authentication" section group
  * Change this line:
       ``<section name="anonymousAuthentication" overrideModeDefault="Deny" />``

       To:
       ``<section name="anonymousAuthentication" overrideModeDefault="Allow" />``
       
  * Change this line:
       ``<section name="windowsAuthentication" overrideModeDefault="Deny" />``

       To:
       ``<section name="windowsAuthentication" overrideModeDefault="Allow" />``
       
  * Save the file
  * Restart IIS from the IIS manager
* Finally, we need to install the SMG application on IIS.
  * Open the IIS Manager
  * Right click on “Sites” and click “Add Website”
  * Set name to smg, choose physical path and set port to 5000 (you can use any port you want)
  * Done! You can check now http://<IP>:5000/, to access admin portal use : http://<IP>:5000/admin/smg

## Manage Authorization and Users

* Open IIS
* Select the application from left side panel
* On the main panel, navigate down to "IIS" section and right click on "Authorization Rules" then click "Open Feature"
* Current settings that it allows all users to do "GET" call to the SMG API, and give full access to users with "Administrators" role. Users with "Administrators" role can access http://<IP>:5000/admin/smg
* You can Add other rule to allow other groups to get full access to manage the API, when adding a rule or editing "Administrators" rule you will use only two options, either to specify a group or a role, or specify set of users.

## Assign a Windows User or Group to a Role 

Follow this documentation
http://technet.microsoft.com/en-us/library/cc731411.aspx
