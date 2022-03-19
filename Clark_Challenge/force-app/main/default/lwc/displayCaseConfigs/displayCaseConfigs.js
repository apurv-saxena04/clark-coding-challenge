import { LightningElement, track, wire, api } from 'lwc';
import allCaseConfigs from '@salesforce/apex/ConfigHandler.getCaseConfigs';
import updateCaseAndPerformCallout from '@salesforce/apex/ConfigHandler.updateCaseAndPerformCallout';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { getRecord, getFieldValue, getRecordNotifyChange } from 'lightning/uiRecordApi';
import STATUS_FIELD from "@salesforce/schema/Case.Status";
import { subscribe, unsubscribe, onError } from 'lightning/empApi';

const fields = [STATUS_FIELD];
export default class DisplayCaseConfigs extends LightningElement {
    
    @api recordId;
    @api case;
    @api sortedDirection = 'asc';
    @api sortedBy = 'Name';

    @track payload = [];
    @track columns = [
        { label: 'Label', fieldName: 'Label__c', type: 'text'},
        { label: 'Type', fieldName: 'Type__c', type: 'text'},
        { label: 'Amount', fieldName: 'Amount__c', type: 'number'}
    ];

    @track allCaseConfigs;
    
    disabled = false;
    selectedRecords=[];
    payloadSelectedRecords=[];
    isLoading = false;
    subscription = {};
    error;
    CHANNEL_NAME = '/event/Refresh_Case_Config__e';
    
    @wire(getRecord, { recordId: '$recordId', fields: fields })
    wiredRecord({ error, data }) {
        if (error) {
            let message = 'Unknown error';
            if (Array.isArray(error.body)) {
                message = error.body.map(e => e.message).join(', ');
            } else if (typeof error.body.message === 'string') {
                message = error.body.message;
            }
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Error loading contact',
                    message,
                    variant: 'error',
                }),
            );
        } else if (data) {
            this.case = data;
            var status = this.case.fields.Status.value;
            if(status == 'Closed'){
                this.disabled = true;
            }else{
                this.disabled = false;
            }
        }
    }

    connectedCallback() {
        this.isLoading = true;
        this.getCaseConfigs();
        console.log('In connected callback-->');
        subscribe(this.CHANNEL_NAME, -1, this.refreshList).then(response => {
            this.subscription = response;
        });
        console.log('this.subscription--->'+ JSON.stringify(this.subscription));
        onError(error => {
            console.error('Server Error--->'+error);
        });
    }

    sortColumns( event ) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;      
    }

    refreshList = ()=> {
        this.isLoading = true;
        console.log('Inside refresh list-->isLoading'+this.isLoading);
        this.getCaseConfigs();
    }

    getCaseConfigs(){
        console.log('Inside getCaseConfigs-->');
        allCaseConfigs({caseId: this.recordId, sortBy: this.sortedBy, sortDirection: this.sortedDirection})
        .then(result => {
            this.allCaseConfigs = result;
            this.error = undefined;
            this.isLoading = false;
        })
        .catch(error => {
            this.error = error;
            this.allCaseConfigs = undefined;
            this.isLoading = false;
        });
    }

    disconnectedCallback() {
        unsubscribe(this.subscription, () => {
            console.log('Unsubscribed Channel');
        });
    }
    
    getSelectedRecords(event){
        const selectedRows = event.detail.selectedRows;
        this.selectedRecords = [];
        for(let i=0; i < selectedRows.length; i++){
            this.selectedRecords.push(selectedRows[i]);
        }
        console.log('this.selectedRecords-->'+JSON.stringify(this.selectedRecords));
    }

    //Generic method to display toast messages
    displayToast(typeStr, messageStr, titleStr){
        const event = new ShowToastEvent({
            title: titleStr,
            message: messageStr,
            variant: typeStr,
            mode: 'dismissable'
        });

        this.dispatchEvent(event);        

    }

    async sendRequest(){
        if(this.selectedRecords){
            console.log('send request callled');
            this.payloadSelectedRecords = this.selectedRecords;
            this.disabled = true;
            for(var i = 0; i < this.payloadSelectedRecords.length; i++){
                delete this.payloadSelectedRecords[i]['Id'];
                delete this.payloadSelectedRecords[i]['Name'];
            } 

            var payload = {
                "caseId" : this.recordId,
                "status" : "Closed",
                "caseConfigs" : this.payloadSelectedRecords
            };

            console.log('payload-->'+JSON.stringify(payload));
            await updateCaseAndPerformCallout({payload : JSON.stringify(payload), caseId : this.recordId})
            .then(result => {
                console.log('result on sending req-->'+JSON.stringify(result));
                if(result.includes("unsuccessful")){
                    this.displayToast('error',result,'Error');
                }else{
                    this.displayToast('success',result,'Success!!');
                }
                getRecordNotifyChange([{recordId: this.recordId}]);
            })
            .catch(error =>{
                console.log('error on sending req-->'+JSON.stringify(error));
            })
            
        }
    }
}