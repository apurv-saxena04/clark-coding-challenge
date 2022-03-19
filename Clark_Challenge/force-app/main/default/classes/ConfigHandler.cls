public with sharing class ConfigHandler {
    
    //Method to get all config records in the database
    @AuraEnabled(cacheable=true)
    public static List<Config__c> getAllConfigs(String sortBy, String sortDirection){
        String query = 'SELECT id,Name,Label__c,Type__c,Amount__c FROM Config__c';
        if ( sortBy != null && sortDirection != null ) {
            query += ' ORDER BY ' + sortBy + ' ' + sortDirection;
        }
        system.debug('query---'+query);
        return Database.query( query );
    }

    //Method to get all releted config records wrt case record
    @AuraEnabled
    public static List<Case_Config__c> getCaseConfigs(String caseId, String sortBy, String sortDirection){
        List<Case_Config__c> caseConfigList = new List<Case_Config__c>();
        String query = 'SELECT id,Name,Label__c,Type__c,Amount__c FROM Case_Config__c where Case__c =: caseId';
        if ( sortBy != null && sortDirection != null ) {
            query += ' ORDER BY ' + sortBy + ' ' + sortDirection;
        }
        caseConfigList = Database.query(query);
        if(caseConfigList.size()>0){
            return caseConfigList;
        }
        return null;
    }

    //Method is called when 'Add' button is pressed. Adds the selected config records to case.
    @AuraEnabled
    public static string addConfigsToCase(List<Config__c> configList, String caseId){
        String successMessage = 'Configs records added successfully';
        List<Case_Config__c> caseConfigList = new List<Case_Config__c>();

        for(Config__c config : configList){
            Case_Config__c caseConfigRec = new Case_Config__c();
            caseConfigRec.Name = config.Name;
            caseConfigRec.Amount__c = config.Amount__c;
            caseConfigRec.Case__c = caseId;
            caseConfigRec.Label__c = config.Label__c;
            caseConfigRec.Type__c = config.Type__c;

            caseConfigList.add(caseConfigRec);
        }

        if(caseConfigList.size()>0){
            try{
                database.insert(caseConfigList,true);
                return successMessage;
            }catch(Exception ex){
                system.debug('Exception while adding case configs-->'+ ex.getMessage());
                return ex.getMessage();
            }
        }

        return null;
    }

    //Method is called when 'Send' button is pressed. It performs the callout and then updates the case.
    @AuraEnabled
    public static String updateCaseAndPerformCallout(String payload, String caseId){
        String response = performCallout(payload);
        if(response == 'Callout is successful'){
            Case caseObj = [SELECT Id,Status FROM Case WHERE id =: caseId];
            caseObj.Status = 'Closed';
            try{
                update caseObj;
            }catch(Exception ex){
                system.debug('Exception while updating case -->'+ ex.getMessage());
            }
        }
        
        return response;
    }

    public static string performCallout(String payload){
        system.debug('payload-->'+payload);
        String endpointUrl = 'https://caseconfigs.requestcatcher.com';
        Http http = new Http();
        HttpRequest req = new HttpRequest();
        req.setEndpoint(endpointUrl);
        req.setMethod('POST');
        req.setBody(payload);
        // Send the request, and return a response
        HttpResponse res = http.send(req);
        if(res.getStatusCode() == 200){
            return 'Callout is successful';
        }else{
            return 'Callout is unsuccessful';
        }
    }
}