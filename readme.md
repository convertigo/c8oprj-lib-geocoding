# lib_Geocoding
This is the geocoding library for Convertigo platform when network is reachable. Install this library to geocode coordinates for your Convertigo applications. It is based on Bing Maps location API.

# Installation

* In your Convertigo Studio use File->Import->Convertigo->Convertigo Project and hit the 'Next' button

* In the Dialog 'Project remote URL' field Paste :

        lib_MicrosoftExcel=https://github.com/convertigo/c8oprj-lib-geocoding.git

* And click the 'Finish' button
* Create all 'Undefined Global Symbols' when prompted

# Usage

## How to get your API Key

This library is based on Bing Maps location API, to have this:

* Go to https://www.bingmapsportal.com/ and sign in with your Microsoft account, if you don't have one, create one through the process
* Go to "My Account" and click on "My Keys"
* Fill out the form and click "Create" and get your API key details
* Copy your API key

## Configuring Convertigo Symbols

__lib_Geocoding__ needs some symbols to be configured. You configure them through the Web Console: **https://&lt;your site&gt;.convertigo.net/admin**, hit the ___symbols___ button to get to the symbol configuration page.


Symbol  | value
------| ------
lib_Geocoding.BingsMapsApiKey | Your **API key** value you copied from previous step

## Sequences

__lib_Geocoding__ provides sequences you can call in your projects

Sequence  | Action
------| ------
getGeocodeBingMaps | Return an object with human-readable address from coordinates. <br>Takes 3 variables :<br>- point : The coordinates of the location that you want to reverse geocode. A point is specified by a latitude and a longitude.<br >- includeEntityTypes : Specifies the entity types that you want to return in the response. Only the types you specify will be returned. If the point cannot be mapped to the entity types you specify, no location information is returned in the response.<br >- key : Your API key from symbol.

These sequences will only work if you performed a OAuth Authentication to AzureAD first. To help you with this, the library provides a Shared action you can use in your Apps. 

## Sample Application

You will find in this project a sample application using the Microsoft Excel Sheet Library, use this as a reference and tutorial about using the library. This demonstrates :
- Use of the **Authenticate** Shared Action
- use of the **SheetGetRange** Sequence

