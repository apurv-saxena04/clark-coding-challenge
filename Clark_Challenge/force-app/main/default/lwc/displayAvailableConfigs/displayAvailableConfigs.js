import { LightningElement, track, wire,api } from 'lwc';
import getAllConfigs from '@salesforce/apex/ConfigHandler.getAllConfigs';
import addConfigsToCase from '@salesforce/apex/ConfigHandler.addConfigsToCase';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';

export default class DisplayAvailableConfigs extends LightningElement {
    @api recordId;
    @track getAllConfigs;
    @track recordsCount = 0;
    @track isTrue = false;
    @api sortedDirection = 'asc';
    @api sortedBy = 'Name';
    result;

    //variables for pagination
    @track page = 1; 
    @track data = []; 
    @track startingRecord = 1;
    @track endingRecord = 0; 
    @track pageSize = 5; 
    @track totalRecountCount = 0;
    @track totalPage = 0;

    @track columns = [
        { label: 'Label', fieldName: 'Label__c', type: 'text'},
        { label: 'Type', fieldName: 'Type__c', type: 'text'},
        { label: 'Amount', fieldName: 'Amount__c', type: 'number'}
    ];

    selectedRecords = [];
    

    @wire(getAllConfigs, {sortBy: '$sortedBy', sortDirection: '$sortedDirection'})
    wiredConfigs({data,error}){
        if(data){
            console.log('data'+JSON.stringify(data));
            this.getAllConfigs = data;    
            this.totalRecountCount = data.length;
            this.totalPage = Math.ceil(this.totalRecountCount / this.pageSize); 
            this.data = this.getAllConfigs.slice(0,this.pageSize); 
            this.endingRecord = this.pageSize;
            this.error = undefined;
        }else if(error){
            console.log('error > '+JSON.stringify(error));
        }
    }

    //clicking on previous button this method will be called
    previousHandler() {
        if (this.page > 1) {
            this.page = this.page - 1; //decrease page by 1
            this.displayRecordPerPage(this.page);
        }
    }

    //clicking on next button this method will be called
    nextHandler() {
        if((this.page<this.totalPage) && this.page !== this.totalPage){
            this.page = this.page + 1; //increase page by 1
            this.displayRecordPerPage(this.page);            
        }             
    }

    sortColumns( event ) {
        this.sortedBy = event.detail.fieldName;
        this.sortedDirection = event.detail.sortDirection;
        //return refreshApex(this.result);
        
    }

    //this method displays records page by page
    displayRecordPerPage(page){
        this.startingRecord = ((page -1) * this.pageSize) ;
        this.endingRecord = (this.pageSize * page);
        this.endingRecord = (this.endingRecord > this.totalRecountCount) ? this.totalRecountCount : this.endingRecord; 
        this.data = this.getAllConfigs.slice(this.startingRecord, this.endingRecord);
        this.startingRecord = this.startingRecord + 1;
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

    getSelectedRecords(event){
        const selectedRows = event.detail.selectedRows;
        this.recordsCount = event.detail.selectedRows.length;
        this.selectedRecords = [];
        for(let i=0; i < selectedRows.length; i++){
            this.selectedRecords.push(selectedRows[i]);
        }
    }

    addConfigs() {
        if(this.selectedRecords){
            this.isTrue = true;
            console.log('selected records --> '+ JSON.stringify(this.selectedRecords));
            addConfigsToCase({configList: this.selectedRecords, caseId: this.recordId})
            .then(result => {
                console.log('result ==>' + result);
                var message = this.recordsCount + ' ' +result;
                if(result.includes("DUPLICATE_VALUE")){
                    this.displayToast('error','Duplicate values found','Error');
                }else if(result.includes("FIELD_CUSTOM_VALIDATION_EXCEPTION")){
                    this.displayToast('error','You cannot add configs when request is already sent','Error');
                }else{
                    this.displayToast('success',message,'Success!!');
                }
                
                this.template.querySelector('lightning-datatable').selectedRows = [];
                this.recordsCount = 0;
            }).catch(error => {
                console.log('error ==>' + JSON.stringify(error));
                this.displayToast('error',JSON.stringify(error),'Error while adding Config records');
            })
        }
    }
}