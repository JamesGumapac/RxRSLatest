/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url', 'N/ui/message', 'N/currentRecord', 'N/url', 'N/record', 'N/search', 'N/runtime'],
function (url, message, currentRecord, url, record, search, runtime){
    var SEA_RETURN_ITEM_RQSTD = 'customsearch_kd_return_item_requested';
    var REC_RET_REQ = 'customsale_kod_returnrequest';
    var FLD_RR_MFG_PROCESSING = 'custcol_kod_mfgprocessing';
    var FLD_RR_PHARMA_PROCESSING = 'custcol_kod_rqstprocesing';
    var FLD_RR_IT_CONTROL_TYPE = 'custcol_kod_controlnum';
    var FLD_RR_IT_EXPIRATION_DATE = 'custcol_kd_expiration';
    var FLD_RR_IT_INDATE_FLAG = 'custcol_kd_indate_flag';
    var FLD_RR_IT_INDATE = 'custcol_kd_indate';
    var FLD_RR_IT_IS_DAMAGED = 'custcol_kod_damageditem';
    var FLD_RR_IT_DAMAGE_TYPE = 'custcol_kod_damagecode';
    var REC_RET_POLICY = 'customrecord_kod_returnpolicy_cr';
    var FLD_RP_IN_MONTHS = 'custrecord_kod_indate';
    var FLD_RP_OUT_MONTHS = 'custrecord_kod_rtnpolicy_dayexp';
    var FLD_RP_C2_HANDICAP_DAYS = 'custrecord_kod_c2handicap';
    var FLD_RP_RX_C35_HANDICAP_DAYS = 'custrecord_kod_pharmacrallow';
    var FLD_RP_DOES_NOT_ALLOW_RETURN = 'custrecord_kd_notallowsrtrn';
    var FLD_RP_ALLOWS_PARTIAL = 'custrecord_kd_partialallowed';
    var FLD_RP_ALLOWS_OTC = 'custrecord_kod_otcallowed';
    var FLD_RP_ACCEPTED_FULL_CONTAINER = 'custrecord_kod_rtnpolicy_drugform';
    var FLD_RP_ACCEPTED_PARTIAL_CONTAINER = 'custrecord_kod_partialallowed';
    var FLD_RP_MINQTY_EACH = 'custrecord_kod_minqty_each';
    var FLD_RP_MINQTY_GRAMS = 'custrecord_kod_minqty_grams';
    var FLD_RP_MINQTY_ML = 'custrecord_kod_minqty_ml';
    var FLD_RIR_FORM_222_REF_NUM = 'custrecord_kd_rir_form222_ref';
    var FLD_RIR_RR = 'custrecord_kd_rir_return_request';
    var FLD_RIR_CATEGORY = 'custrecord_kd_rir_category';
    var REC_RETURN_ITEM_REQUESTED = 'customrecord_kod_mr_item_request';
    var PROCESSING_NON_RETURNABLE = 1;
    var PROCESSING_RETURNABLE = 2;
    var CUST_TYPE_PREPAID = 3;
    var CUST_TYPE_QUICK_CASH = 4;
    var CUST_TYPE_DESTRUCTION = 5;
    var DAMAGE_TYPE_1 = 1;
    var DAMAGE_TYPE_2 = 2;
    var FULL_PACKAGE = 1;
    var PARTIAL_PACKAGE = 2;
    var IT_CT_C2 = 3;
    var FLD_IT_RETURN_POLICY = 'custcol_kd_return_policy';
    var FLD_IT_OUT_MONTHS = 'custitem_kd_mfg_out_months';
    var FLD_IT_IN_MONTHS = 'custitem_kd_mfg_in_months';
    var FLD_IT_C2_HANDICAP_DAYS = 'custitem_kd_c2_handicap_days';
    var FLD_IT_RX_C35_HANDICAP_DAYS = 'custitem_kd_rx_c35_handicap_days';
    var CATEGORY_C2 = 3;
    function create222Reference(){
        var currRecord = currentRecord.get();
        window.open('/app/common/custom/custrecordentry.nl?rectype=402&custscript_rrid='+currRecord.id, '_self');
    }
    function assign222Form(){
        try{
            record.submitFields({
                type: REC_RET_REQ,
                id: currentRecord.get().id,
                values: {
                    custbody_kd_for_222_form_assignment: 'T'
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields : true
                }
            });
            alert('222 Form assignment is scheduled for the transaction.');
            location.reload();
        }catch(ex){
            log.error({title: 'map/reduce task creation', details: ex });
        }
    }
    function generateOutboundLabel(){
        alert('Outbound Label will be generated!\nPlease wait for the record to be created.');
        var currRec = currentRecord.get();
        var rrId = currRec.id;
        var fieldLookUp = search.lookupFields({
            type: 'customsale_kod_returnrequest',
            id: rrId,
            columns: ['entity', 'custbody_kd_master_return_id']
        });
        var customer = fieldLookUp['entity'][0].value;
        var mrrId = fieldLookUp['custbody_kd_master_return_id'][0].value;
        var returnPackage = record.create({
            type: 'customrecord_kod_mr_packages',
            isDynamic: true
        });
        returnPackage.setValue({
            fieldId: 'custrecord_kd_rp_customer',
            value: customer
        });
        returnPackage.setValue({
            fieldId: 'custrecord_kod_rtnpack_mr',
            value: mrrId
        });
        returnPackage.setValue({
            fieldId: 'custrecord_kod_packrtn_rtnrequest',
            value: rrId
        });
        returnPackage.setValue({
            fieldId: 'custrecord_kd_is_222_kit',
            value: true
        });
        returnPackage.setValue({
            fieldId: 'custrecord_kod_packrtn_control',
            value: '3'
        });
        var recordId = returnPackage.save({
            enableSourcing: true,
            ignoreMandatoryFields: true
        });
        alert('Outbound Label is generated!');
        log.debug('generateOutboundLabel', 'Return Package ' + recordId + ' is generated!');
    }
    function setExpirationDate(currentRecord){
        var invDtl = currentRecord.getCurrentSublistSubrecord({
            sublistId: 'item',
            fieldId: 'inventorydetail'
        });
        var expiDate = invDtl.getSublistValue({
            sublistId: 'inventoryassignment',
            fieldId: 'expirationdate',
            line: 0
        })
        log.debug('test', 'EXPIRATION DATE: ' + expiDate);
        currentRecord.setCurrentSublistValue({
            sublistId: 'item',
            fieldId: FLD_RR_IT_EXPIRATION_DATE,
            value: expiDate
        });
    }
    function pageInit(context) {
        var currRec = context.currentRecord;
        if(currRec.getValue('custbody_kd_for_222_form_assignment')){
            log.debug('TEST', 'pageInit')
            var myMsg2 = message.create({
                title: 'My Title 2',
                message: 'My Message 2',
                type: message.Type.INFORMATION
            });
            myMsg2.show();
            setTimeout(myMsg2.hide, 15000);
        }
    }
    function fieldChanged(context) {
        // Navigate to selected page
        try{
            if(context.sublistId == 'item'){
                switch(context.fieldId) {
                    case 'item':
                    case 'custcol_kd_expiration':
                        var currRec = context.currentRecord;
                        var qty = currRec.getCurrentSublistValue('item', 'quantity');
                        var expiDate = currRec.getCurrentSublistValue('item', 'custcol_kd_expiration');
                        
                        /*var objSubrecord = currRec.getCurrentSublistSubrecord({
                            sublistId: 'item',
                            fieldId: 'inventorydetail'
                        });*/

                        /*objSubrecord.selectNewLine({
                            sublistId: 'inventoryassignment',
                        });

                        objSubrecord.setCurrentSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'numberedrecordid',
                            value: 2022
                        });

                        objSubrecord.setCurrentSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'quantity',
                            value: qty
                        });

                        objSubrecord.setCurrentSublistValue({
                            sublistId: 'inventoryassignment',
                            fieldId: 'expirationdate',
                            value: expiDate
                        });

                        objSubrecord.commitLine({
                            sublistId: 'inventoryassignment'
                        });

                        objSubrecord.commit();     */
                        break;
                    case 'custcol_kod_fullpartial':
                        if(context.currentRecord.getCurrentSublistValue('item', 'custcol_kod_fullpartial') == PARTIAL_PACKAGE){
                            context.currentRecord.setCurrentSublistValue('item', 'quantity', 1);
                            //var partialCountField = context.currentRecord.getField('custcol_kd_partialcount');
                            //partialCountField.isDisabled = false;
                        }else{
                          	if(context.currentRecord.getCurrentSublistValue('item', 'custcol_kd_partialcount') != ''){
                            	alert('Setting Partial Count to empty.');
	                            context.currentRecord.setCurrentSublistValue('item', 'custcol_kd_partialcount', '');  
                            }                      	
                            //var partialCountField = context.currentRecord.getField('custcol_kd_partialcount');
                            //partialCountField.isDisabled = true;
                        }
                        break;
                    case 'quantity':
                        if( context.currentRecord.getCurrentSublistValue('item', 'custcol_kod_fullpartial') == PARTIAL_PACKAGE &&
                            context.currentRecord.getCurrentSublistValue('item', 'quantity') > 1){
                            alert('Quantity cannot be greater than 1 when Partial Package is selected.');
                            context.currentRecord.setCurrentSublistValue('item', 'quantity', 1);
                        }
                        break;
                    case 'custcol_kd_partialcount':
                        if( context.currentRecord.getCurrentSublistValue('item', 'custcol_kod_fullpartial') == FULL_PACKAGE &&
                            context.currentRecord.getCurrentSublistValue('item', 'custcol_kd_partialcount') >= 0){
                                alert('Partial Count is not necessary when Full Package is selected.');
                            context.currentRecord.setCurrentSublistValue({
                                sublistId: 'item', 
                                fieldId: 'custcol_kd_partialcount', 
                                value: '', 
                                ignoreFieldChange: true
                            });
                        }
                        break;
                    default:
                        // code block
                }
            }
        }catch(ex){
            log.debug('fieldChanged', ex.toString())
        }
    }
    function validateLine(context) {
        var currentRecord = context.currentRecord;
        var sublistName = context.sublistId;
        var pharmaProcessing, mfgProcessing, fullPartialPackage, drugForm, acceptedFullContainer, acceptedPartialContainer;
        var isIndate = false;
        var isApplyReturnPolicyDays = false;
        if(sublistName === 'item'){
            if(currentRecord.getCurrentSublistValue(sublistName, 'custcol_kod_fullpartial') == 2){//2 Partial Package
                if(currentRecord.getCurrentSublistValue(sublistName, 'custcol_kd_partialcount') == '' || currentRecord.getCurrentSublistValue(sublistName, 'custcol_kd_partialcount') == null){
                    alert('Partial Count is required when Partial Package is selected.\nPlease enter Partial Count.')
                    return false;
                }
            }
            log.debug('validateLine', 'START')
            returnPolicy = currentRecord.getCurrentSublistValue({
                sublistId: sublistName,
                fieldId: FLD_IT_RETURN_POLICY
            });
            var retPolicyDetails = getReturnPolicyDetails(returnPolicy);
            log.debug('TEST', 'RET POLICY DETAILS ' + JSON.stringify(retPolicyDetails));
            var customerType = currentRecord.getValue('custbody_kd_customer_type');
            var returnable = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: 'custcol_kd_returnable'
            });
            var isDamagedItem = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: FLD_RR_IT_IS_DAMAGED
            });
            var damageType = currentRecord.getCurrentSublistValue({
                sublistId: 'item',
                fieldId: FLD_RR_IT_DAMAGE_TYPE
            });
            var itemIsOtc = false;
            if(currentRecord.getCurrentSublistValue({
                sublistId: sublistName,
                fieldId: 'custcol_kd_prescription_otc'
            }) == 2){
                itemIsOtc = true;
            }
            log.debug('TEST', 'item is returnable? ' +returnable)
            
            if((returnPolicy == '') || (returnPolicy != '' && retPolicyDetails.notallowreturn)){
                pharmaProcessing = PROCESSING_NON_RETURNABLE;
                mfgProcessing = {processing: PROCESSING_NON_RETURNABLE, isindate: false, indate: ''};
                //mfgProcessing = PROCESSING_NON_RETURNABLE;
            }/*else if((customerType == CUST_TYPE_PREPAID || customerType == CUST_TYPE_DESTRUCTION)){
                pharmaProcessing = PROCESSING_NON_RETURNABLE;
                log.debug('TEST', 'get expi date');
                var expiDate = new Date(currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: FLD_RR_IT_EXPIRATION_DATE
                }));
                log.debug('TEST', 'expi date' + expiDate);
                if(expiDate == 'Invalid Date' || expiDate == ''){
                    alert('Please enter Expiration Date!');
                    return false;
                }
                var firstDayExpiDate = new Date(expiDate.getFullYear(), expiDate.getMonth(), 1);
                mfgProcessing = getMfgProcessing(expiDate, retPolicyDetails)
            }*/else if(!returnable){
                pharmaProcessing = PROCESSING_NON_RETURNABLE;
                mfgProcessing = {processing: PROCESSING_NON_RETURNABLE, isindate: false, indate: ''};
                //mfgProcessing = PROCESSING_NON_RETURNABLE;
            }else if(isDamagedItem){
                if(damageType == DAMAGE_TYPE_1){
                    pharmaProcessing = PROCESSING_NON_RETURNABLE;
                    mfgProcessing = {processing: PROCESSING_RETURNABLE, isindate: false, indate: ''};
                    alert('damaged item ' + pharmaProcessing + ' ' + mfgProcessing.processing)
                    //mfgProcessing = PROCESSING_RETURNABLE;
                }else if(damageType == DAMAGE_TYPE_2){
                    pharmaProcessing = PROCESSING_NON_RETURNABLE;
                    mfgProcessing = {processing: PROCESSING_NON_RETURNABLE, isindate: false, indate: ''};
                    alert('damaged item ' + pharmaProcessing + ' ' + mfgProcessing.processing)
                    //mfgProcessing = PROCESSING_NON_RETURNABLE;
                }
            }else if(itemIsOtc && !retPolicyDetails.allowsotc){
                pharmaProcessing = PROCESSING_NON_RETURNABLE;
                mfgProcessing = {processing: PROCESSING_NON_RETURNABLE, isindate: false, indate: ''};
                //mfgProcessing = PROCESSING_NON_RETURNABLE;
            }else{
                fullPartialPackage = currentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'custcol_kod_fullpartial'
                });
                drugForm = currentRecord.getCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: 'custcol_kd_drugform'
                });
                if(fullPartialPackage == FULL_PACKAGE){
                    if(retPolicyDetails.acceptedfullcontainer != null && retPolicyDetails.acceptedfullcontainer !== undefined && retPolicyDetails.acceptedfullcontainer.indexOf(drugForm) >= 0){
                        log.debug('TEST', 'Drug Form is allowed for full container on Return Policy');
                        pharmaProcessing = PROCESSING_RETURNABLE;
                        mfgProcessing = {processing: PROCESSING_RETURNABLE, isindate: false, indate: ''};
                        //mfgProcessing = PROCESSING_RETURNABLE;
                        isApplyReturnPolicyDays = true;
                    }else{
                        log.debug('TEST', 'Drug Form is NOT allowed for full container on Return Policy');
                        pharmaProcessing = PROCESSING_NON_RETURNABLE;
                        mfgProcessing = {processing: PROCESSING_NON_RETURNABLE, isindate: false, indate: ''};
                        //mfgProcessing = PROCESSING_NON_RETURNABLE;
                    }
                }else{
                    var drugFormMinQty, checkCustomerState = false, checkMinQty = false;
                    switch(drugForm){
                        case '1'://each
                            drugFormMinQty = retPolicyDetails.minqtyeach;
                            break;
                        case '2'://ml
                            drugFormMinQty = retPolicyDetails.minqtyml;
                            break;
                        case '3'://grams
                            drugFormMinQty = retPolicyDetails.minqtygrams;
                            break;
                    }
                    var packageSize = currentRecord.getCurrentSublistValue({
                        sublistId: sublistName,
                        fieldId: 'custcol_package_size'
                    });
                    if(drugFormMinQty == null || drugFormMinQty == undefined || drugFormMinQty == ''){
                        drugFormMinQty = 0;
                    }
                    if(packageSize == null || packageSize == undefined || packageSize == ''){
                        packageSize = 0;
                    }
                    var minQtyPackageSize = (parseFloat(drugFormMinQty) / 100) * parseFloat(packageSize);
                    var itemPartialQty = currentRecord.getCurrentSublistValue({
                        sublistId: sublistName,
                        fieldId: 'custcol_kd_partialcount'
                    });
                    log.debug('TEST', drugFormMinQty + ' * ' + packageSize + ' = ' + minQtyPackageSize);
                    if(retPolicyDetails.allowspartial){
                        if(retPolicyDetails.acceptedpartialcontainer != null && retPolicyDetails.acceptedpartialcontainer !== undefined && retPolicyDetails.acceptedpartialcontainer.indexOf(drugForm) >= 0){
                            log.debug('TEST', 'drug form is accepted in partial')
                            if(itemPartialQty < minQtyPackageSize){
                                log.debug('TEST', 'item partial qty is less than minQtyOfPackageSize')
                                pharmaProcessing = PROCESSING_NON_RETURNABLE;
                                mfgProcessing = {processing: PROCESSING_NON_RETURNABLE, isindate: false, indate: ''};
                                //mfgProcessing = PROCESSING_NON_RETURNABLE;
                            }else{
                                log.debug('TEST', 'item partial qty is greater than minQtyOfPackageSize')
                                pharmaProcessing = PROCESSING_RETURNABLE;
                                mfgProcessing = {processing: PROCESSING_RETURNABLE, isindate: false, indate: ''};
                                //mfgProcessing = PROCESSING_RETURNABLE;
                                isApplyReturnPolicyDays = true;
                            }
                        }else{
                            checkCustomerState = true;
                        }    
                    }else{
                        checkCustomerState = true;
                    }

                    if(checkCustomerState){
                        var lookupFieldsRs = search.lookupFields({
                            type: 'customer',
                            id: currentRecord.getValue('entity'),
                            columns: ['billstate']
                        });
                        var customerState = lookupFieldsRs['billstate'][0].text;
                        pharmaProcessing = PROCESSING_NON_RETURNABLE;
                        mfgProcessing = {processing: PROCESSING_NON_RETURNABLE, isindate: false, indate: ''};
                        //mfgProcessing = PROCESSING_NON_RETURNABLE;
                        log.debug('TEST', 'Customer State is ' + customerState);
                        if(customerState != 'MS' && customerState != 'GA' && customerState != 'NC'){
                            pharmaProcessing = PROCESSING_NON_RETURNABLE;
                            mfgProcessing = {processing: PROCESSING_NON_RETURNABLE, isindate: false, indate: ''};
                            //mfgProcessing = PROCESSING_NON_RETURNABLE;
                            //isApplyReturnPolicyDays = true;
                        }else{
                            if(itemPartialQty < minQtyPackageSize){
                                log.debug('TEST', 'item qty is less than minQtyOfPackageSize')
                                pharmaProcessing = PROCESSING_NON_RETURNABLE;
                                mfgProcessing = {processing: PROCESSING_NON_RETURNABLE, isindate: false, indate: ''};
                                //mfgProcessing = PROCESSING_NON_RETURNABLE;
                            }else{
                                log.debug('TEST', 'item qty is greater than minQtyOfPackageSize')
                                pharmaProcessing = PROCESSING_RETURNABLE;
                                mfgProcessing = {processing: PROCESSING_RETURNABLE, isindate: false, indate: ''};
                                //mfgProcessing = PROCESSING_RETURNABLE;
                                isApplyReturnPolicyDays = true;
                            }
                        }
                    }
                }

                if(isApplyReturnPolicyDays){
                    log.debug('TEST', 'get expi date');
                    var expiDate = new Date(currentRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: FLD_RR_IT_EXPIRATION_DATE
                    }));
                    log.debug('TEST', 'expi date' + expiDate);
                    if(expiDate == 'Invalid Date' || expiDate == ''){
                        alert('Please enter Expiration Date!');
                        return false;
                    }
                    var firstDayExpiDate = new Date(expiDate.getFullYear(), expiDate.getMonth(), 1);
                    log.debug('CHECK HERE', 'expiration date adjusted ' +firstDayExpiDate);
                    var itemControlType = currentRecord.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: FLD_RR_IT_CONTROL_TYPE
                    });
                    log.debug('TEST', 'passed to getPharmaProcessing ' + JSON.stringify(retPolicyDetails));
                    pharmaProcessing = getPharmaProcessing(firstDayExpiDate, retPolicyDetails, itemControlType);
                    mfgProcessing = getMfgProcessing(firstDayExpiDate, retPolicyDetails);
                }else{
                    log.debug('TEST', 'Did not apply Return Policy')
                }
            }

            if((customerType == CUST_TYPE_PREPAID || customerType == CUST_TYPE_DESTRUCTION)){
                pharmaProcessing = PROCESSING_NON_RETURNABLE;
                /*log.debug('TEST', 'get expi date');
                var expiDate = new Date(currentRecord.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: FLD_RR_IT_EXPIRATION_DATE
                }));
                log.debug('TEST', 'expi date' + expiDate);
                if(expiDate == 'Invalid Date' || expiDate == ''){
                    alert('Please enter Expiration Date!');
                    return false;
                }
                var firstDayExpiDate = new Date(expiDate.getFullYear(), expiDate.getMonth(), 1);
                mfgProcessing = getMfgProcessing(expiDate, retPolicyDetails)*/
            }
            
            log.debug('TEST', 'PP: ' + pharmaProcessing + '; MP: ' + mfgProcessing.processing);
            if(pharmaProcessing != null && pharmaProcessing != ''){            
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: FLD_RR_PHARMA_PROCESSING,
                    value: pharmaProcessing,
                    ignoreFieldChange: true
                });
            }
            if(mfgProcessing != null && mfgProcessing != '' && mfgProcessing.hasOwnProperty('processing')){
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: FLD_RR_MFG_PROCESSING,
                    value: mfgProcessing.processing,
                    ignoreFieldChange: true
                });
            }
            log.debug('TEST', 'mfgProcessing ' + JSON.stringify(mfgProcessing))
            if(mfgProcessing.isindate){
                var inDate = new Date(firstDayExpiDate.getFullYear(), firstDayExpiDate.getMonth(), firstDayExpiDate.getDate());
                inDate.setMonth(inDate.getMonth() - (parseInt(retPolicyDetails.inmonths) - 1));
                //log.debug('TEST', mfgReturnableStart.getMonth() + ' - (' + returnPolicyDays.inmonths + ' - 1)');
                //var inDate = new Date(mfgReturnableStart.getFullYear(), mfgReturnableStart.getMonth(), mfgReturnableStart.getDate());
                inDate.setDate(inDate.getDate() - 1);
                inDate.setHours(0, 0, 0, 0);
                log.debug('TEST', 'inDate ' + inDate);

                log.debug('TEST', 'updating in dates information');
                
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: FLD_RR_IT_INDATE_FLAG,
                    value: true,
                    ignoreFieldChange: true
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: FLD_RR_IT_INDATE,
                    value: inDate,
                    ignoreFieldChange: true
                });
            }else{
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: FLD_RR_IT_INDATE_FLAG,
                    value: false,
                    ignoreFieldChange: true
                });
                currentRecord.setCurrentSublistValue({
                    sublistId: sublistName,
                    fieldId: FLD_RR_IT_INDATE,
                    value: '',
                    ignoreFieldChange: true
                });
            }
        }

        return true;
    }
    function getSuiteletPage() {
        document.location = url.resolveScript({
            scriptId : 'customscript_kd_sl_return_request_form',
            deploymentId : 'customdeploy_kd_sl_return_request_form',

        });
    }
    function showMessage() {
        alert('Return Request Has Been Created Successfully')
    }
    function authorize(context){
        //alert('authorize ' + currentRecord.get().id);
        /*redirect.toSuitelet({
                    scriptId: 'customscript_kd_sl_generate_form222',
                    deploymentId: 'customdeploy_kd_sl_generate_form222',
                    parameters: {
                        'custscript_kd_rr_id': currentRecord.get().id
                    }
                });*/
        if(!isAllForm222NoHasContent()){
            alert('All Form 222 No. must at least have 1 item on it.');
        }else{
            var suiteletURL = url.resolveScript({
                scriptId: 'customscript_kd_sl_generate_form222',
                deploymentId: 'customdeploy_kd_sl_generate_form222',
                returnExternalUrl: false,
                params: {
                    'custscript_kd_rr_id': currentRecord.get().id,
                    'custscript_kd_rr_authorized_by': runtime.getCurrentUser().id
                }
            });
            location.href = suiteletURL;
        }
    }
    function isAllForm222NoHasContent(){
        //var recRetReq = currentRecord.get();
        var lookupFieldsRs = search.lookupFields({
            type: REC_RET_REQ,
            id: currentRecord.get().id,
            columns: ['custbody_kd_master_return_id', 'custbody_kd_no_form_222']
        });
        var rrMrr = lookupFieldsRs['custbody_kd_master_return_id'][0].value;
        var rrNoForm222 = lookupFieldsRs['custbody_kd_no_form_222'];
        
        var c2RirSearch = search.load({
            id: 'customsearch_kd_rir_by_form_222'
        });
        c2RirSearch.filters.push(search.createFilter({
            name: 'custrecord_kd_rir_masterid',
            operator: search.Operator.ANYOF,
            values: rrMrr
        }));
        var rs = c2RirSearch.run().getRange({start: 0, end: 1000});
        if(rs.length > 0){
            if(rrNoForm222 == rs.length){
                return true;
            }
        }

        return false;
    }
    function isAllRirHaveForm222(rrId) {
        var rirSearch = search.create({
            type: REC_RETURN_ITEM_REQUESTED,
            columns: [search.createColumn({
                name: 'internalid',
                summary: search.Summary.COUNT
            })],
            filters: [{
                name: FLD_RIR_FORM_222_REF_NUM,
                operator: 'anyof',
                values: ['@NONE@']
            },{
                name: FLD_RIR_RR,
                operator: 'anyof',
                values: [rrId]
            },{
                name: FLD_RIR_CATEGORY,
                operator: 'anyof',
                values: [CATEGORY_C2]
            }]
        });
        var rs = rirSearch.run().getRange(0,1);
        var rirCount = rs[0].getValue({name: 'internalid', summary: search.Summary.COUNT});
        log.debug('isAllRirHaveForm222', 'RIR COUNT: ' + rirCount);
        if(rirCount > 0){
            return false;
        }
        return true;
    }
    function createForm222(){
        //if(!isAllForm222NoHasContent()){
        if(!isAllRirHaveForm222(currentRecord.get().id)){
            //alert('All Form 222 No. must at least have 1 item on it.');
            alert('All Return Item Requested must have Form 222 Reference No.');
        }else{
            var suiteletURL = url.resolveScript({
                scriptId: 'customscript_kd_sl_generate_form222',
                deploymentId: 'customdeploy_kd_sl_generate_form222',
                returnExternalUrl: false,
                params: {
                    'custscript_kd_rr_id': currentRecord.get().id,
                    'custscript_kd_rr_authorized_by': runtime.getCurrentUser().id
                }
            });
            location.href = suiteletURL;
        }
    }
    function getReturnPolicyDetails(returnPolicy){
        var rpDetails = {};

        if(returnPolicy != null && returnPolicy != ''){
            var lookupFieldsRs = search.lookupFields({
                type: REC_RET_POLICY,
                id: returnPolicy,
                columns: [FLD_RP_IN_MONTHS, FLD_RP_OUT_MONTHS, FLD_RP_RX_C35_HANDICAP_DAYS, FLD_RP_C2_HANDICAP_DAYS, FLD_RP_DOES_NOT_ALLOW_RETURN, FLD_RP_ALLOWS_PARTIAL, FLD_RP_ALLOWS_OTC, FLD_RP_ACCEPTED_PARTIAL_CONTAINER, FLD_RP_ACCEPTED_FULL_CONTAINER, FLD_RP_MINQTY_EACH, FLD_RP_MINQTY_GRAMS, FLD_RP_MINQTY_ML]
            });
            
            var acceptedPartial = [];
            for(var i = 0; i < lookupFieldsRs[FLD_RP_ACCEPTED_PARTIAL_CONTAINER].length; i++){
                acceptedPartial.push(lookupFieldsRs[FLD_RP_ACCEPTED_PARTIAL_CONTAINER][i].value);
            }

            var acceptedFull = [];
            for(var i = 0; i < lookupFieldsRs[FLD_RP_ACCEPTED_FULL_CONTAINER].length; i++){
                acceptedFull.push(lookupFieldsRs[FLD_RP_ACCEPTED_FULL_CONTAINER][i].value);
            }
            
            rpDetails = {
                'inmonths' : lookupFieldsRs[FLD_RP_IN_MONTHS] != ''? lookupFieldsRs[FLD_RP_IN_MONTHS]  : 0,
                'outmonths' : lookupFieldsRs[FLD_RP_OUT_MONTHS] != ''? lookupFieldsRs[FLD_RP_OUT_MONTHS] : 0,
                'c2days' : lookupFieldsRs[FLD_RP_C2_HANDICAP_DAYS] != ''? lookupFieldsRs[FLD_RP_C2_HANDICAP_DAYS]: 0,
                'rxc35days' : lookupFieldsRs[FLD_RP_RX_C35_HANDICAP_DAYS] != ''? lookupFieldsRs[FLD_RP_RX_C35_HANDICAP_DAYS] : 0,
                'notallowreturn': lookupFieldsRs[FLD_RP_DOES_NOT_ALLOW_RETURN],
                'minqtyeach': lookupFieldsRs[FLD_RP_MINQTY_EACH] != ''? lookupFieldsRs[FLD_RP_MINQTY_EACH] : 0,
                'minqtygrams': lookupFieldsRs[FLD_RP_MINQTY_GRAMS] != ''? lookupFieldsRs[FLD_RP_MINQTY_GRAMS] : 0,
                'minqtyml': lookupFieldsRs[FLD_RP_MINQTY_ML] != ''? lookupFieldsRs[FLD_RP_MINQTY_ML] : 0,
                'allowspartial': lookupFieldsRs[FLD_RP_ALLOWS_PARTIAL],
                'allowsotc': lookupFieldsRs[FLD_RP_ALLOWS_OTC],
                'acceptedpartialcontainer': acceptedPartial,//lookupFieldsRs[FLD_RP_ACCEPTED_PARTIAL_CONTAINER],
                'acceptedfullcontainer': acceptedFull//lookupFieldsRs[FLD_RP_ACCEPTED_FULL_CONTAINER]
            };
        }
        
        return rpDetails;
    }
    function getReturnPolicyDays(returnPolicy){
        var rpDetails = {};

        if(returnPolicy != null && returnPolicy != ''){
            var lookupFieldsRs = search.lookupFields({
                type: REC_RET_POLICY,
                id: returnPolicy,
                columns: [FLD_RP_IN_MONTHS, FLD_RP_OUT_MONTHS, FLD_RP_RX_C35_HANDICAP_DAYS, FLD_RP_C2_HANDICAP_DAYS]
            });
            
            rpDetails = {
                'inmonths' : lookupFieldsRs[FLD_RP_IN_MONTHS],
                'outmonths' : lookupFieldsRs[FLD_RP_OUT_MONTHS],
                'c2days' : lookupFieldsRs[FLD_RP_C2_HANDICAP_DAYS],
                'rxc35days' : lookupFieldsRs[FLD_RP_RX_C35_HANDICAP_DAYS]
            };
        }
        
        return rpDetails;
    }
    function meetsOutDays(returnPolicyDays, nextDayExpiDate, outDate, processing, controlType){
        var meetsOutDays = false;
        var sysDate = new Date();
        var outDaysStart, outDaysEnd;
        outDaysStart = nextDayExpiDate;
        outDaysEnd = new Date(outDate.getFullYear(), outDate.getMonth(), outDate.getDate());
        log.debug('TEST', outDaysEnd + ' + ' + returnPolicyDays.outmonths)
        outDaysEnd.setMonth(outDaysEnd.getMonth() + parseInt(returnPolicyDays.outmonths));
        
        var handicapDays;
        if(controlType == IT_CT_C2){
            handicapDays = returnPolicyDays.c2days;
        }else{
            handicapDays = returnPolicyDays.rxc35days;
        }
        
        if(processing == 'manufacturing'){
            outDaysEnd = new Date(outDaysEnd.getFullYear(), outDaysEnd.getMonth() + 1, 0);
        }else{
            outDaysEnd.setDate(outDaysEnd.getDate() - parseInt(handicapDays));  
        }
        log.debug('TEST', processing + ' OUTDAYS: ' + outDaysStart + ' to ' + outDaysEnd)
        if(sysDate >= outDaysStart && sysDate <= outDaysEnd){
            meetsOutDays = true;
        }
        return meetsOutDays;
    }
    function meetsInDays(returnPolicyDays, nextDayExpiDate, inDate, processing){
        var meetsInDays = false;
        var sysDate = new Date();
        var inDaysStart, inDaysEnd;
        inDaysEnd = nextDayExpiDate;
        inDaysStart = new Date(inDate.getFullYear(), inDate.getMonth(), inDate.getDate());
        inDaysStart.setMonth(inDate.getMonth() - parseInt(returnPolicyDays.inmonths));
        if(processing == 'manufacturing'){
            inDaysStart.setMonth(inDaysStart.getMonth() + parseInt(1));
            inDaysStart = new Date(inDaysStart.getFullYear(), inDaysStart.getMonth(), 1);
        }
        log.debug('TEST', processing + ' INDAYS: ' + inDaysStart + ' to ' + inDaysEnd)
        if(sysDate >= inDaysStart && sysDate <= inDaysEnd){
            meetsInDays = true;
        }
        return meetsInDays;
    }
    function meetsHandicapDays(returnPolicyDays, expirationDate, handicapDate, controlType){
        var meetsHandicapDays = false;
        var sysDate = new Date();
        sysDate.setHours(0, 0, 0, 0);
        var handicapDays;

        if(controlType == IT_CT_C2){
            handicapDays = returnPolicyDays.c2days;
        }else{
            handicapDays = returnPolicyDays.rxc35days;
        }
        //alert('retpolicy handicap days' + handicapDays + ' for control type ' + controlType)
        //alert('before: ' + handicapDate);
        if(sysDate >= expirationDate && sysDate < handicapDate.setDate(handicapDate.getDate() + parseInt(handicapDays))){
            meetsHandicapDays = true;
        }
        //alert('sysdate ' + sysDate);
        //alert('handicapdate ' + handicapDate);
        //alert('meets handicap days: '+meetsHandicapDays);
        return meetsHandicapDays;
    }
    function getPharmaProcessing(expirationDate, returnPolicyDays, controlType){
        var pharmaProcessing;
        var sysDate = new Date();
        sysDate.setHours(0, 0, 0, 0);
        sysDate.setDate(sysDate.getDate() + 1 - 1)
        //sysDate = new Date(sysDate.getFullYear(), sysDate.getMonth(), sysDate.getDate());
        var handicapDays;
        if(controlType == IT_CT_C2){
            handicapDays = returnPolicyDays.c2days;
        }else{
            handicapDays = returnPolicyDays.rxc35days;
        }
        var pharmaReturnableStart = new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate());
        pharmaReturnableStart.setMonth(pharmaReturnableStart.getMonth() - parseInt(returnPolicyDays.inmonths));

        var pharmaReturnableEnd = new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate());
        pharmaReturnableEnd.setMonth(pharmaReturnableEnd.getMonth() + parseInt(returnPolicyDays.outmonths) - 1);
        pharmaReturnableEnd = new Date(pharmaReturnableEnd.getFullYear(), pharmaReturnableEnd.getMonth() + 1, 0);
        pharmaReturnableEnd.setDate(pharmaReturnableEnd.getDate() - parseInt(handicapDays))
        
        log.debug('TEST', sysDate)
        log.debug('TEST', 'pharma returnable start ' + pharmaReturnableStart);
        log.debug('TEST', 'pharma returnable end ' + pharmaReturnableEnd);

        log.debug('TEST', 'sysDate >= pharmaReturnableStart ' + sysDate >= pharmaReturnableStart);
        log.debug('TEST', 'sysDate <= pharmaReturnableEnd ' + sysDate <= pharmaReturnableEnd)

        if(sysDate >= pharmaReturnableStart && sysDate <= pharmaReturnableEnd){
            log.debug('TEST', 'sysdate is within pharmaReturnablePeriod');
            var handicapStart = new Date(pharmaReturnableEnd.getFullYear(), pharmaReturnableEnd.getMonth(), pharmaReturnableEnd.getDate());
            //handicapStart.setDate(handicapStart.getDate() - parseInt(handicapDays));
            handicapStart.setDate(handicapStart.getDate() + 1);
            var handicapEnd = new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate());
            handicapEnd.setMonth(expirationDate.getMonth() + parseInt(returnPolicyDays.outmonths) - 1);
            handicapEnd = new Date(handicapEnd.getFullYear(), handicapEnd.getMonth() + 1, 0);
            log.debug('TEST', 'handicap start ' + handicapStart);
            log.debug('TEST', 'handicap end ' + handicapEnd);

            if(sysDate >= handicapStart && sysDate <= handicapEnd){
                pharmaProcessing = PROCESSING_NON_RETURNABLE;
            }else{
                pharmaProcessing = PROCESSING_RETURNABLE
            }
        }else{
            log.debug('TEST', 'sysdate is NOT within pharmaReturnablePeriod');
            if(sysDate < pharmaReturnableStart){
                pharmaProcessing = PROCESSING_RETURNABLE
            }else if(sysDate > pharmaReturnableEnd){
                pharmaProcessing = PROCESSING_NON_RETURNABLE;
            }
        }

        return pharmaProcessing;
    }
    function getMfgProcessing(expirationDate, returnPolicyDays){
        var mfgProcessing;
        var sysDate = new Date();
        sysDate.setHours(0, 0, 0, 0);
        var isInDate = false;

        var mfgReturnableStart = new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate());
        mfgReturnableStart.setMonth(mfgReturnableStart.getMonth() - (parseInt(returnPolicyDays.inmonths) - 1));
        log.debug('TEST', mfgReturnableStart.getMonth() + ' - (' + returnPolicyDays.inmonths + ' - 1)');

        var mfgReturnableEnd = new Date(expirationDate.getFullYear(), expirationDate.getMonth(), expirationDate.getDate());
        mfgReturnableEnd.setMonth(mfgReturnableEnd.getMonth() + parseInt(returnPolicyDays.outmonths));
        mfgReturnableEnd = new Date(mfgReturnableEnd.getFullYear(), mfgReturnableEnd.getMonth() + 1, 0);

        var inDate = new Date(mfgReturnableStart.getFullYear(), mfgReturnableStart.getMonth(), mfgReturnableStart.getDate());
        inDate.setDate(inDate.getDate() - 1);
        inDate.setHours(0, 0, 0, 0);

        log.debug('TEST', 'mfg returnable start ' + mfgReturnableStart);
        log.debug('TEST', 'mfg returnable end ' + mfgReturnableEnd);
        log.debug('TEST', 'in date ' + inDate);
        
        if(sysDate >= mfgReturnableStart && sysDate <= mfgReturnableEnd){
            mfgProcessing = PROCESSING_RETURNABLE;
        }else{
            if(sysDate < mfgReturnableStart){
                mfgProcessing = PROCESSING_RETURNABLE;
                isInDate = true;
            }else if(sysDate > mfgReturnableEnd){
                mfgProcessing = PROCESSING_NON_RETURNABLE;
            }
        }

        return {processing: mfgProcessing, isindate: isInDate, indate: mfgReturnableStart};
    }
    function applyReturnPolicy(){
        alert('Return Policy of items is being applied.');
        try{
            var currentRec = record.load({
                type: REC_RET_REQ,
                id: currentRecord.get().id,
                isDynamic: true,
            });
            
        var customerType = currentRec.getValue('custbody_kd_customer_type');
        var returnable, retPolicy, retPolicyDays, itemControlType, inMonths, outMonths, c2HandicapDays, rxC35HandicapDays;

            for(var i = 0; i < currentRec.getLineCount('item'); i++){
                currentRec.selectLine({
                    sublistId: 'item',
                    line: i
                });

                returnable = currentRec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'custcol_kd_returnable'
                });
                if(!returnable){
                    currentRec.setCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: FLD_RR_MFG_PROCESSING,
                        value: PROCESSING_NON_RETURNABLE,
                        ignoreFieldChange: true
                    });

                    if(customerType == CUST_TYPE_PREPAID || customerType == CUST_TYPE_DESTRUCTION){
                        currentRec.setCurrentSublistValue({
                            sublistId: 'item',
                            fieldId: FLD_RR_PHARMA_PROCESSING,
                            value: PROCESSING_NON_RETURNABLE,
                            ignoreFieldChange: true
                        });
                    }
                }else{
                    retPolicy = currentRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: FLD_IT_RETURN_POLICY
                    });

                    var expiDate = new Date(currentRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: FLD_RR_IT_EXPIRATION_DATE
                    }));

                    var sysDate = new Date();
                    var inDate = new Date(expiDate.getFullYear(), expiDate.getMonth(), expiDate.getDate());
                    var outDate = new Date(expiDate.getFullYear(), expiDate.getMonth(), expiDate.getDate());
                    var handicapDate = new Date(expiDate.getFullYear(), expiDate.getMonth(), expiDate.getDate());
                
                    itemControlType = currentRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: FLD_RR_IT_CONTROL_TYPE
                    });

                    retPolicyDays = getReturnPolicyDays(retPolicy);
                    if(customerType == CUST_TYPE_QUICK_CASH){
                        if(sysDate > expiDate){
                            if(meetsOutDays(retPolicyDays, expiDate, outDate)){
                                currentRec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: FLD_RR_MFG_PROCESSING,
                                    value: PROCESSING_RETURNABLE,
                                    ignoreFieldChange: true
                                });
                                if(meetsHandicapDays(retPolicyDays, expiDate, handicapDate, itemControlType)){
                                    currentRec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: FLD_RR_PHARMA_PROCESSING,
                                        value: PROCESSING_RETURNABLE,
                                        ignoreFieldChange: true
                                    });
                                }else{
                                    currentRec.setCurrentSublistValue({
                                        sublistId: 'item',
                                        fieldId: FLD_RR_PHARMA_PROCESSING,
                                        value: PROCESSING_NON_RETURNABLE,
                                        ignoreFieldChange: true
                                    });
                                }
                            }else{
                                currentRec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: FLD_RR_MFG_PROCESSING,
                                    value: PROCESSING_NON_RETURNABLE,
                                    ignoreFieldChange: true
                                });
                                currentRec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: FLD_RR_PHARMA_PROCESSING,
                                    value: PROCESSING_NON_RETURNABLE,
                                    ignoreFieldChange: true
                                });
                            }
                        }else{
                            currentRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: FLD_RR_MFG_PROCESSING,
                                value: PROCESSING_RETURNABLE,
                                ignoreFieldChange: true
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: FLD_RR_PHARMA_PROCESSING,
                                value: PROCESSING_RETURNABLE,
                                ignoreFieldChange: true
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: FLD_RR_IT_INDATE_FLAG,
                                value: false,
                                ignoreFieldChange: true
                            });

                            if(meetsInDays(retPolicyDays, inDate)){
                                currentRec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: FLD_RR_IT_INDATE_FLAG,
                                    value: true,
                                    ignoreFieldChange: true
                                });
                            }
                            currentRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: FLD_RR_IT_INDATE,
                                value: inDate,
                                ignoreFieldChange: true
                            });
                        }
                    }
                }
                //alert('line ' + i + ' returnable: ' + returnable);
                currentRec.commitLine('item');
            }
            var recId = currentRec.save();
            location.reload();
        }catch(ex){
            alert(ex.toString());
        }
    }
    var REC_MANUF = 'customrecord_csegmanufacturer';
    var FLD_MANUF_SO_MAX = 'custrecord_kd_mfgmaxvaljue';
    var FLD_RR_IT_HAZARDOUS = 'custcol_kd_hazmat_line';
    var FLD_RR_IT_MANUF = 'custcol_kd_item_manufacturer';
    var SEA_MANUF = 'customsearch_kd_manufacturer';
    var SEA_BIN_QTY = 'customsearch_kd_bin_qty'
    var SEA_BINS = 'customsearch_kd_bins';
    function getManufMaxSoAmounts(manufs){
        var manufSearch = search.load({
            id: SEA_MANUF
        });
        manufSearch.filters.push(search.createFilter({
            name: 'internalid',
            operator: search.Operator.ANYOF,
            values: manufs
        }));
        
        var manufRs = manufSearch.run().getRange({start: 0, end: 1000});
        var soMaxAmount, manuf;
        var manufSoMaxAmounts = {};
        for(var i = 0; i < manufRs.length; i++){
            manuf = manufRs[i].id;
            soMaxAmount = manufRs[i].getValue(FLD_MANUF_SO_MAX);
            manufSoMaxAmounts[manuf] = soMaxAmount;
        }
        return manufSoMaxAmounts;
    }
    var hBins = [], dBins = [], rBins = [], binsWithQty = [];
    function getBins(){
        var bins = [];
        var binsSearch = search.load({
            id: SEA_BINS
        });        
        var binsSearchRs = binsSearch.run();
        var start = 0;
        var end = 1000;
        var binsSearchResults = binsSearchRs.getRange({start: start, end: end});
        var binNumber;

        while(binsSearchResults.length > 0){
            for(var i = 0; i < binsSearchResults.length; i++){
                binNumber = binsSearchResults[i].getValue('binnumber');
                if(binNumber.startsWith('h')){
                    hBins.push(binsSearchResults[i].id);
                }else if(binNumber.startsWith('d')){
                    dBins.push(binsSearchResults[i].id);
                }else if(binNumber.startsWith('r')){
                    rBins.push(binsSearchResults[i].id);
                }
                bins.push(binsSearchResults[i].id);
            }

            start += 1000;
            end += 1000;
            binSearchResults = binsSearchRs.getRange({start: start, end: end});
        }

        var binQtySearch = search.load({
            id: SEA_BIN_QTY
        });
        binQtySearch.filters.push(search.createFilter({
        name: 'internalid',
        operator: search.Operator.ANYOF,
        values: bins 
        }));
        var binQtySearchRs = binQtySearch.run();
        start = 0;
        end = 1000;
        var binQtySearchResults = binQtySearchRs.getRange({start: start, end: end});

        while(binQtySearchResults.length > 0){
            for(var i = 0; i < binQtySearchResults.length; i++){
                binsWithQty.push(binQtySearchResults[i].id);
            }

            start += 1000;
            end += 1000;
            binQtySearchResults = binQtySearchRs.getRange({start: start, end: end});
        }
    }
    function createTagLabelRecord(mrr, customer, manufacturer, bin){
        var REC_TAG_LABEL = 'customrecord_kd_taglabel';
        var FLD_TAG_LABEL_MRR = 'custrecord_kd_mrr_link';
        var FLD_TAG_LABEL_MFG = 'custrecord_kd_mfgname';
        var FLD_TAG_LABEL_BIN = 'custrecord_kd_putaway_loc';
        var FLD_TAG_LABEL_CUSTOMER = 'custrecord_kd_tag_customer';

        var tagLabelRec = record.create({
            type: REC_TAG_LABEL,
            isDynamic: true
        });
        
        tagLabelRec.setValue({
            fieldId: FLD_TAG_LABEL_MRR,
            value: mrr,
            ignoreFieldChange: true
        });
        tagLabelRec.setValue({
            fieldId: FLD_TAG_LABEL_CUSTOMER,
            value: customer,
            ignoreFieldChange: true
        });
        tagLabelRec.setValue({
            fieldId: FLD_TAG_LABEL_MFG,
            value: manufacturer,
            ignoreFieldChange: true
        });
        tagLabelRec.setValue({
            fieldId: FLD_TAG_LABEL_BIN,
            value: bin,
            ignoreFieldChange: true
        });
        
        return tagLabelRec.save();
    }
    function createTagLabel(){
        try{
            record.submitFields({
                type: REC_RET_REQ,
                id: currentRecord.get().id,
                values: {
                    custbody_kd_rr_for_tag_label_gen: 'T'
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields : true
                }
            });
            alert('Creation of Tag Label is scheduled for the transaction.');
            location.reload();
        }catch(ex){
            log.error({title: 'map/reduce task creation', details: ex });
        }
    }
    function createTagLabelOld(){
        alert('Tag Labels being created.');
        try{
            var currentRec = record.load({
                type: REC_RET_REQ,
                id: currentRecord.get().id,
                isDynamic: true
            });
            
            //var customerType = currentRec.getValue('custbody_kd_customer_type');
            //var returnable, retPolicy, retPolicyDays, itemControlType, inMonths, outMonths, c2HandicapDays, rxC35HandicapDays;
            var mfgProcessing, isHazardous, manuf, item, amount;
            var hazardousItems = {};
            var nonReturnableItems = {};
            var returnableItems = {};
            var returnableItemsByManuf = {};
            var returnableItemsByManufAndAmount = {};
            var returnableManufs = [];

            for(var i = 0; i < currentRec.getLineCount('item'); i++){
                currentRec.selectLine({
                    sublistId: 'item',
                    line: i
                });

                mfgProcessing = currentRec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: FLD_RR_MFG_PROCESSING
                });
                isHazardous = currentRec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: FLD_RR_IT_HAZARDOUS
                });
                manuf = currentRec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: FLD_RR_IT_MANUF
                });
                item = currentRec.getCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'item'
                });

                if(isHazardous){
                    if(!hazardousItems.hasOwnProperty(manuf)){
                        hazardousItems[manuf] = [];
                    }
                    hazardousItems.push({rrLineNo: i, item: item})
                }else{
                    amount = currentRec.getCurrentSublistValue({
                        sublistId: 'item',
                        fieldId: 'amount'
                    });
                    if(mfgProcessing == PROCESSING_NON_RETURNABLE){
                        if(!nonReturnableItems.hasOwnProperty(manuf)){
                            nonReturnableItems[manuf] = [];
                        }
                        nonReturnableItems.push({rrLineNo: i, item: item});
                    }else{
                        if(!returnableItemsByManuf.hasOwnProperty(manuf)){
                            returnableItemsByManuf[manuf] = [];
                            returnableManufs.push(manuf);
                        }
                        returnableItemsByManuf[manuf].push({rrLineNo: i, item: item, amount: amount});
                    }
                }
                currentRec.commitLine('item');
            }

            if(Object.keys(returnableItemsByManuf).length  > 0){
                var manufSoMaxAmounts = getManufMaxSoAmounts(returnableManufs);
                var manufSoMaxAmount, soTotalAmount, manufTagCount, returnableItem;
                var isAddedToList = false;

                for(var manuf in returnableItemsByManuf){
                    manufSoMaxAmount = manufSoMaxAmounts[manuf];
                    soTotalAmount = 0;
                    returnableItemsByManufAndAmount[manuf] = [];
                    manufTagCount = 0;
                    manufTagTotal = [];

                    for(var i = 0; i < returnableItemsByManuf[manuf].length; i++){
                        isAddedToList = false;
                        returnableItem = returnableItemsByManuf[manuf][i];
                        if(manufSoMaxAmount == ''){
                            if(returnableItemsByManufAndAmount[manuf][manufTagCount] == null){
                                returnableItemsByManufAndAmount[manuf][manufTagCount] = [];
                            }
                            returnableItemsByManufAndAmount[manuf][manufTagCount].push({
                                rrLineNo: returnableItem.rrLineNo,
                                item: returnableItem.item,
                                amount: returnableItem.amount
                            });
                        }else{
                            if(returnableItemsByManufAndAmount[manuf].length == 0){
                                alert('adding a new index');
                                returnableItemsByManufAndAmount[manuf][0] = [];
                                manufTagTotal[0] = 0;
                            }
                            alert(returnableItemsByManufAndAmount[manuf].length);
                            for(var j = 0; j < returnableItemsByManufAndAmount[manuf].length; j++){
                                alert((parseFloat(manufTagTotal[j]) + parseFloat(returnableItem.amount)) + ' <= ' + manufSoMaxAmount);
                                if((parseFloat(manufTagTotal[j]) + parseFloat(returnableItem.amount)) <= manufSoMaxAmount){
                                    alert('adding to index ' + j);
                                    isAddedToList = true;
                                    returnableItemsByManufAndAmount[manuf][j].push({
                                        rrLineNo: returnableItem.rrLineNo,
                                        item: returnableItem.item,
                                        amount: returnableItem.amount
                                    });
                                    manufTagTotal[j] = parseFloat(manufTagTotal[j]) + parseFloat(returnableItem.amount);
                                    break;
                                }
                            }
                            if(!isAddedToList){
                                manufTagCount = returnableItemsByManufAndAmount[manuf].length;
                                returnableItemsByManufAndAmount[manuf][manufTagCount] = [];
                                alert('added new index ' + manufTagCount);
                                returnableItemsByManufAndAmount[manuf][manufTagCount].push({
                                    rrLineNo: returnableItem.rrLineNo,
                                    item: returnableItem.item,
                                    amount: returnableItem.amount
                                });
                                manufTagTotal[manufTagCount] = parseFloat(manufTagTotal[manufTagCount]) + parseFloat(returnableItem.amount);
                            }
                            //if((parseFloat(soTotalAmount) + parseFloat(returnableItem.amount)) > )
                        }
                    }
                }
            }
            //var recId = currentRec.save();
            //alert(JSON.stringify(returnableItemsByManufAndAmount));
            getBins();
            
            var FLD_RR_MRR = 'custbody_kd_master_return_id';
            var FLD_RR_CUSTOMER = 'custbody_kd_customer_type';
            var FLD_RR_ITEM_TAG = 'custcol_kd_baglabel_link';
            var mrr = currentRec.getValue(FLD_RR_MRR);
            var customer = currentRec.getValue(FLD_RR_CUSTOMER);
            var tagId, bin, binIndx, rrLine;
            if(Object.keys(hazardousItems).length  > 0){
                for(var manuf in hazardousItems){
                    bin = '';
                    binIndx = '';
                    for(var i = 0; i < hBins.length; i++){
                        if(binsWithQty.indexOf(hBins[i]) < 0){
                            bin = hBins[i];
                            binIndx = i;
                            break;
                        }
                    }
                    if(bin != ''){
                        if(binIndx != ''){
                            hBins.slice(binIndx+1);
                        }
                        tagId = createTagLabelRecord(mrr, customer, manuf, bin);
                        for(var j = 0; j < hazardousItems[manuf].length; j++){
                            rrLine = hazardousItems[manuf][j].rrLineNo;
                            currentRec.selectLine({
                                sublistId: 'item',
                                line: rrLine
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: FLD_RR_ITEM_TAG,
                                value: tagId,
                                ignoreFieldChange: true
                            });
                            currentRec.commitLine({
                                sublistId: 'item'
                            });
                        }
                    }
                }
            }
            if(Object.keys(nonReturnableItems).length  > 0){
                for(var manuf in nonReturnableItems){
                    bin = '';
                    binIndx = '';
                    for(var i = 0; i < dBins.length; i++){
                        if(binsWithQty.indexOf(dBins[i]) < 0){
                            bin = dBins[i];
                            binIndx = i;
                            break;
                        }
                    }
                    if(bin != ''){
                        if(binIndx != ''){
                            dBins.slice(binIndx+1);
                        }
                        tagId = createTagLabelRecord(mrr, customer, manuf, bin);
                        for(var j = 0; j < nonReturnableItems[manuf].length; j++){
                            rrLine = nonReturnableItems[manuf][j].rrLineNo;
                            currentRec.selectLine({
                                sublistId: 'item',
                                line: rrLine
                            });
                            currentRec.setCurrentSublistValue({
                                sublistId: 'item',
                                fieldId: FLD_RR_ITEM_TAG,
                                value: tagId,
                                ignoreFieldChange: true
                            });
                            currentRec.commitLine({
                                sublistId: 'item'
                            });
                        }
                    }
                }
            }
            if(Object.keys(returnableItemsByManufAndAmount).length  > 0){
                for(var manuf in returnableItemsByManufAndAmount){
                    for(var manufSoIndx = 0; manufSoIndx < returnableItemsByManufAndAmount[manuf].length; manufSoIndx++){
                        bin = '';
                        binIndx = '';
                        for(var i = 0; i < rBins.length; i++){
                            if(binsWithQty.indexOf(rBins[i]) < 0){
                                bin = rBins[i];
                                binIndx = i;
                                break;
                            }
                        }
                        if(bin != ''){
                            if(binIndx != ''){
                                rBins.slice(binIndx+1);
                            }
                            tagId = createTagLabelRecord(mrr, customer, manuf, bin);
                            alert('tag id created: ' + tagId)
                            var returnables = returnableItemsByManufAndAmount[manuf][manufSoIndx];
                            for(var j = 0; j < returnables.length; j++){
                                rrLine = returnable[j].rrLineNo;
                                currentRec.selectLine({
                                    sublistId: 'item',
                                    line: rrLine
                                });
                                currentRec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: FLD_RR_ITEM_TAG,
                                    value: tagId,
                                    ignoreFieldChange: true
                                });
                                currentRec.commitLine({
                                    sublistId: 'item'
                                });
                            }
                        }
                    }
                }
            }
            currentRec.save();
            location.reload();
        }catch(ex){
            alert(ex.toString());
        }
    }
    function updateNoC2Forms(id){
        try {
            var stSuiteletUrl = url.resolveScript({
                scriptId: 'customscript_kd_sl_update_no_c2_forms',
                deploymentId: 'customdeploy_kd_sl_update_no_c2_forms',
            });
            stSuiteletUrl = stSuiteletUrl + '&custscript_id=' + id; //objRecord.id;
            var intHeight = 300;
            var intWidth = 600;
            var dualScreenLeft =
                window.screenLeft != undefined ? window.screenLeft : window.screenX;
            var dualScreenTop = window.screenTop != undefined ? window.screenTop : window.screenY;

            var width = window.innerWidth
                ? window.innerWidth
                : document.documentElement.clientWidth
                ? document.documentElement.clientWidth
                : screen.width;
            var height = window.innerHeight
                ? window.innerHeight
                : document.documentElement.clientHeight
                ? document.documentElement.clientHeight
                : screen.height;

            var systemZoom = width / window.screen.availWidth;
            var left = (width - intWidth) / 2 / systemZoom + dualScreenLeft;
            var top = (height - intHeight) / 2 / systemZoom + dualScreenTop;

            var newWindow = window.open(
                stSuiteletUrl,
                'Update No. C2 Forms',
                'width=' + intWidth + ',height=' + intHeight + ',top=' + top + ',left=' + left
            );
            newWindow.focus();
        }catch(e){
            console.log('err', e.toString());
        }
    }
    function updateNoForm222(id){
        try {
            var stSuiteletUrl = url.resolveScript({
                scriptId: 'customscript_kd_sl_update_no_form_222',
                deploymentId: 'customdeploy_kd_sl_update_no_form_222',
            });
            stSuiteletUrl = stSuiteletUrl + '&custscript_kd_updatenoform222_rr_id=' + id; //objRecord.id;
            var intHeight = 300;
            var intWidth = 600;
            var dualScreenLeft =
                window.screenLeft != undefined ? window.screenLeft : window.screenX;
            var dualScreenTop = window.screenTop != undefined ? window.screenTop : window.screenY;

            var width = window.innerWidth
                ? window.innerWidth
                : document.documentElement.clientWidth
                ? document.documentElement.clientWidth
                : screen.width;
            var height = window.innerHeight
                ? window.innerHeight
                : document.documentElement.clientHeight
                ? document.documentElement.clientHeight
                : screen.height;

            var systemZoom = width / window.screen.availWidth;
            var left = (width - intWidth) / 2 / systemZoom + dualScreenLeft;
            var top = (height - intHeight) / 2 / systemZoom + dualScreenTop;

            var newWindow = window.open(
                stSuiteletUrl,
                'Update No. Form 222',
                'width=' + intWidth + ',height=' + intHeight + ',top=' + top + ',left=' + left
            );
            newWindow.focus();
        }catch(e){
            console.log('err', e.toString());
        }
    }
    var REC_FORM222_REF = 'customrecord_kd_222formrefnum';
    var FLD_FORM222_RR = 'custrecord_kd_returnrequest';
    var FLD_FORM222_PAGE = 'custrecord_kd_form222_page';
    var FLD_RIR_FORM222_NO = 'custrecord_kd_rir_form_222_no';
    var FLD_RIR_FORM222_REF = 'custrecord_kd_rir_form222_ref';
    var SEA_FORM222_REF = 'customsearch_kd_222_form_ref_num';
    var SEA_C2_RIR = 'customsearch_kd_return_item_requested';
    function getForm222RefRecIds(rrId){
        var form222RefSearch = search.load({
            id: SEA_FORM222_REF
        });
        form222RefSearch.filters.push(search.createFilter({
            name: FLD_FORM222_RR,
            operator: search.Operator.ANYOF,
            values: rrId
        }));
        /*form222RefSearch.filters.push(search.createFilter({
            name: FLD_FORM222_PAGE,
            operator: search.Operator.GREATERTHAN,
            values: noForm222
        }));*/
        var form222RefRecIds = [];
        var rs = form222RefSearch.run().getRange({start: 0, end: 1000});
        for(var i = 0; i < rs.length; i++){
            form222RefRecIds.push(rs[i].id);
        }
        return form222RefRecIds;
    }
    function autoAssignForm222(ids){
        try{
            var ids = ids.split(',');
            var rrId = ids[0];
            var mrrId = ids[1];
            alert(rrId + ' ' + mrrId);
            var rrRec = record.load({
                type: 'customsale_kod_returnrequest',
                id: rrId
            });
            var currentNoForm222 = rrRec.getValue('custbody_kd_no_form_222');
            var rrRirCount = rrRec.getLineCount('custpage_sublist_items_requested');
            var form222Needed = Math.ceil(parseInt(rrRirCount) / 20);
            var form222RefRecIds = getForm222RefRecIds(rrId);
            var currentPageCount = 0;
            var form222RefIndex = 0;
            var rirId;
            alert('rir count ' + rrRirCount)
            for(var i = 0; i < rrRirCount; i++){
                rirId = rrRec.getSublistValue({
                    sublistId: 'custpage_sublist_items_requested',
                    fieldId: 'custpage_col_id',
                    line: i
                });
                alert('rir id ' + rirId)
                record.submitFields({
                    type: REC_RETURN_ITEM_REQUESTED,
                    id: rirId,
                    values: {
                        'custrecord_kd_rir_form222_ref': form222RefRecIds[form222RefIndex]
                    },
                    options: {
                        enableSourcing: true,
                        ignoreMandatoryFields : true
                    }
                });
                currentPageCount++;
                if(currentPageCount == 20){
                    currentPageCount = 0;
                    currentPage++;
                    form222RefIndex++;
                }
            }
            
            for(var i = form222Needed; i < form222RefRecIds.length; i++){
                record.delete({
                    type: REC_FORM222_REF,
                    id: form222RefRecIds[i],
                });
            }
            record.submitFields({
                type: 'customsale_kod_returnrequest',
                id: rrId,
                values: {
                    'custbody_kd_no_form_222': form222Needed
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields : true
                }
            });
            location.reload();
        }catch(ex){
            alert(ex.toString());
        }
    }
    function autoAssignForm222OLD(ids){
        var ids = ids.split(',');
        var rrId = ids[0];
        var mrrId = ids[1];
        //alert(rrId + ' ' + mrrId);
        var objSearch = search.load({
            id: SEA_RETURN_ITEM_RQSTD
        })
        objSearch.filters.push(search.createFilter({
            name: 'custrecord_kd_rir_masterid',
            operator: search.Operator.ANYOF,
            values: mrrId
        }));
        var searchRs = objSearch.run().getRange({ start: 0, end: 1000 });
        var currentPageCount = 0;
        var currentPage = 1;
        for(var i = 0; i < searchRs.length; i++){
            record.submitFields({
                type: REC_RETURN_ITEM_REQUESTED,
                id: searchRs[i].id,
                values: {
                    'custrecord_kd_rir_form_222_no': currentPage
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields : true
                }
            });
            currentPageCount++;
            if(currentPageCount == 20){
                currentPageCount = 0;
                currentPage++;
            }
        }
        var form222Count = Math.ceil(searchRs.length / 20);
        record.submitFields({
            type: 'customsale_kod_returnrequest',
            id: rrId,
            values: {
                'custbody_kd_no_form_222': form222Count
            },
            options: {
                enableSourcing: false,
                ignoreMandatoryFields : true
            }
        });
        location.reload();

        /*var rrSearch = search.load({
            id: 'customsearch_kd_mr_rr_sublist'
        });
        rrSearch.filters.push(search.createFilter({
            name: 'custbody_kd_master_return_id',
            operator: search.Operator.ANYOF,
            values: mrrId
        }));
        rrSearch.filters.push(search.createFilter({
            name: 'custbody_kd_rr_category',
            operator: search.Operator.ANYOF,
            values: CATEGORY_C2
        }));
        var rs = rrSearch.run().getRange({ start: 0, end: 1 });
        if(rs.length > 0){
            var rrId = rs[0].id;
            record.submitFields({
                type: 'customsale_kod_returnrequest',
                id: rrId,
                values: {
                    'custbody_kd_no_form_222': form222Count
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields : true
                }
            });
        }*/
    }
    function saveRecord(scriptContext){
        var currRec = scriptContext.currentRecord;
        var itPackageSize, partialCount, qty, rate, amount;
        for(var i = 0; i < currRec.getLineCount('item'); i++){
            currRec.selectLine('item', i);
            itPackageSize = currRec.getCurrentSublistValue('item', 'custcol_package_size');
            itPackageSize = itPackageSize == null || itPackageSize == '' ? 0 : itPackageSize;
            partialCount = currRec.getCurrentSublistValue('item', 'custcol_kd_partialcount');
            qty = currRec.getCurrentSublistValue('item', 'quantity');
            rate = currRec.getCurrentSublistValue('item', 'rate');
            log.debug('test', 'qty: ' + qty + '; partialCount: ' + partialCount + '; itPackageSize: ' + itPackageSize + '; rate: ' + rate);
            if(partialCount > 0){
                amount = (qty *(partialCount / itPackageSize)) * rate;
                currRec.setCurrentSublistValue({
                    sublistId: 'item',
                    fieldId: 'amount',
                    value: amount,
                    ignoreFieldChange: true
                });
            }        
            currRec.commitLine({
                sublistId: 'item'/*,
                ignoreRecalc: true*/
            });
        }
        
        return true;
    }
    return {
        pageInit : pageInit,
        fieldChanged : fieldChanged,
        validateLine : validateLine,
        //saveRecord : saveRecord,
        getSuiteletPage : getSuiteletPage,
        showMessage : showMessage,
        authorize: authorize,
        applyReturnPolicy: applyReturnPolicy,
        updateNoC2Forms: updateNoC2Forms,
        createForm222: createForm222,
        updateNoForm222: updateNoForm222,
        autoAssignForm222: autoAssignForm222,
        createTagLabel: createTagLabel,
        create222Reference: create222Reference,
        assign222Form: assign222Form,
        generateOutboundLabel: generateOutboundLabel
    };
});