@isTest
public class ConfigHandlerTest {
    
	Public static String sortedDirection = 'asc';
    Public static String sortedBy = 'Name';
    
    @testSetup static void setup() {
        //Insert case record
        Case caseObj = new Case();
        caseObj.Status = 'New';
        caseObj.Priority = 'Medium';
        caseObj.Origin = 'Email';
        insert caseObj;
        system.assert(caseObj.Id != null);
        
        //Insert Case Config record
        Case_Config__c caseConfigObj = new Case_Config__c();
        caseConfigObj.Case__c = caseObj.Id;
        caseConfigObj.Amount__c = 10.00;
        caseConfigObj.Label__c = 'test label';
        caseConfigObj.Type__c = 'test type';
        insert caseConfigObj;
        system.assert(caseConfigObj.Id != null);
        
        //Insert config records
        List<Config__c> configList = new List<Config__c>();
        for(integer i=0; i<10; i++){
            configList.add(new Config__c(Name='test Config'+i, Label__c='test label'+i, Amount__c= 10.00));
        }
        insert configList;
    }
    
    @isTest static void testMethod1() {
        Case caseObj = [SELECT id FROM Case WHERE Origin = 'Email' LIMIT 1];
        List<Config__c> configList = [SELECT id,Name,Amount__c,Label__c,Type__c FROM Config__c WHERE Amount__c = 10.00 LIMIT 10];
        test.startTest();
        ConfigHandler.getAllConfigs(sortedBy, sortedDirection);
        ConfigHandler.getCaseConfigs(caseObj.Id, sortedBy, sortedDirection);
        ConfigHandler.addConfigsToCase(configList,caseObj.Id);
		test.stopTest();        
    }
    
    @isTest static void testMethod2() {
        Case caseObj = [SELECT id FROM Case WHERE Origin = 'Email' LIMIT 1];
        Test.setMock(HttpCalloutMock.class, new ConfigCalloutMock());
        String payload = '{"caseId":"5005j00000LkOxZAAV","status":"Closed","caseConfigs":[{"Label__c":"test 4","Type__c":"test","Amount__c":20},{"Label__c":"test 3","Type__c":"test","Amount__c":18}]}';
    	Test.startTest();
        ConfigHandler.updateCaseAndPerformCallout(payload, caseObj.Id);
    	Test.stopTest();
    }
}