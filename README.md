# Salesforce Project Challenge for Clark

## Introduction
In this project we are assigning the Config records to case record from the list of available Configs.
After assigning, the config records are mapped to the case record and displayed in the Case Config lightning web component.
The config records are further send as a part of request to the third-party request-catcher.

## Components Used

### Lightning Web Components

- [displayCaseConfigs] Responsible to display the associated config records to the case record.
- [displayAvailableConfigs] Responsible to display all the config records present in the database.

### Apex Classes

- [ConfigHandler] Apex class handler performing all the business logic in the background.
- [ConfigHandlerTest] Test class to cover all methods of ConfigHandler with 88% coverage.
- [ConfigCalloutMock]  Class which performs mock callout. Referenced in ConfigHandlerTest.

### Custom Object

- [Case_Config__c] Created as part of project requirement.
- [Config__c] Created as part of the project requirement.
- [Refresh_Case_Config__e] Platform event created to publish/subcsribe the case id which refresh the case record without loading the page.

### Flows

- [CreatePlatformEvent] Process Builder created which creates a Platform event record on every insertion of the Case config record.

### Remote Site Settings

- [CaseConfigEndpoint] Remote site setting to authorize https://caseconfigs.requestcatcher.com/

### Flexi Page

- [Case_Record_Page] Case record page which includes all the lightning web components

### Validation Rule

- [Closed_case_error_message] Validation rule on Case_Config__c object which prevents to add new case config records once the request is already sent.