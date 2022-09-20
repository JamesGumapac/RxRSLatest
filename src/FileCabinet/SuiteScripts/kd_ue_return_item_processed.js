/**
 *@NApiVersion 2.x
 *@NScriptType UserEventScript
 */
define(['N/record', 'N/error', 'N/search'],
function(record, error, search) {
    var REC_RETURN_REQUEST = 'customsale_kod_returnrequest';
    var REC_RETURN_ITEM_PROCESSED = 'customrecord_kod_mr_item_process';
    var FLD_RIP_PHARMACY_PROCESSING = 'custrecord_kd_ips_returnable';
    var FLD_RIP_PRICE_LEVEL = 'custrecord_kd_ret_item_pricelevel';
    var FLD_RIP_UNIT_PRICE = 'custrecord_kd_rate';
    var FLD_RIP_NON_RETURNABLE_REASON = 'custrecord_kd_ips_non_returnable_reason';
    var FLD_RIP_MRR_STATUS = 'custrecord_kd_rip_mrr_status';
    var FLD_RIP_LINE_UNIQUE_ID = 'custrecord_kd_rip_line_unique_id';
    var FLD_RIP_MRR = 'custrecord_master_return_id';
    var FLD_RIP_RR = 'custrecord_kd_ips_return_request';
    var FLD_RR_IT_PHARMA_PROCESSING = 'custcol_kod_rqstprocesing';
    var FLD_RR_IT_NON_RET_REASON = 'custcol_kd_non_returnable_reason';

    function beforeLoad(context){
        if (context.type !== context.UserEventType.EDIT)
            return;

        var fieldLookUp = search.lookupFields({
            type: 'customrecord_kod_masterreturn',
            id: mrrId,
            columns: ['custrecord_kod_mr_status']
        });
        var mrrStatus = fieldLookUp['custrecord_kod_mr_status'][0].value;
        if(mrrStatus == 8 || mrrStatus == 12){//8 waiting approval; 12 price locked

        }
    }
    function afterSubmit(context) {
        if (context.type !== context.UserEventType.EDIT)
            return;

        var ripRec = context.newRecord;
        //var mrrId = ripRec.getValue(FLD_RIP_MRR);
        var mrrStatus = ripRec.getValue(FLD_RIP_MRR_STATUS);

        /*var fieldLookUp = search.lookupFields({
            type: 'customrecord_kod_masterreturn',
            id: mrrId,
            columns: ['custrecord_kod_mr_status']
        });
        var mrrStatus = fieldLookUp['custrecord_kod_mr_status'][0].value;*/
        if(mrrStatus == 8 || mrrStatus == 12){//8 waiting approval; 12 price locked
            var rrId = ripRec.getValue(FLD_RIP_RR);
            var rrLineKey = ripRec.getValue(FLD_RIP_LINE_UNIQUE_ID);
            var pharmaProcessing = ripRec.getValue(FLD_RIP_PHARMACY_PROCESSING);
            var priceLevel = ripRec.getValue(FLD_RIP_PRICE_LEVEL);
            var unitPrice = ripRec.getValue(FLD_RIP_UNIT_PRICE);
            var nonRetReason = ripRec.getValue(FLD_RIP_NON_RETURNABLE_REASON);

            /*var ripRec = record.load({
                type: REC_RETURN_ITEM_PROCESSED,
                id: ripNewRec.id,
                isDynamic: true
            });*/
            var rrRec = record.load({
                type: REC_RETURN_REQUEST,
                id: rrId,
                isDynamic: true
            });
            var mrrStatus = rrRec.getValue('custbody_kd_rr_mrr_status');
            
            var lineKey, itPackageSize, partialCount, qty, rate, amount;
            for(var i = 0; i < rrRec.getLineCount('item'); i++){
                rrRec.selectLine('item', i);
                lineKey = rrRec.getCurrentSublistValue('item', 'lineuniquekey');
                if(lineKey == rrLineKey){
                    rrRec.setCurrentSublistValue('item', FLD_RR_IT_PHARMA_PROCESSING, pharmaProcessing);
                    rrRec.setCurrentSublistValue('item', 'price', priceLevel);
                    rrRec.setCurrentSublistValue('item', 'rate', unitPrice);
                    rrRec.setCurrentSublistValue('item', FLD_RR_IT_NON_RET_REASON, nonRetReason);

                    if(mrrStatus == 8){
                        if(rrRec.getCurrentSublistValue('item', 'custcol_kod_fullpartial') == 2){
                            itPackageSize = rrRec.getCurrentSublistValue('item', 'custcol_package_size');
                            itPackageSize = itPackageSize == null || itPackageSize == '' ? 0 : itPackageSize;
                            partialCount = rrRec.getCurrentSublistValue('item', 'custcol_kd_partialcount');
                            qty = rrRec.getCurrentSublistValue('item', 'quantity');
                            rate = rrRec.getCurrentSublistValue('item', 'rate');
                            log.debug('test', 'qty: ' + qty + '; partialCount: ' + partialCount + '; itPackageSize: ' + itPackageSize + '; rate: ' + rate);
                            if(partialCount > 0){
                                amount = (qty *(partialCount / itPackageSize)) * rate;
                                rrRec.setCurrentSublistValue({
                                    sublistId: 'item',
                                    fieldId: 'amount',
                                    value: amount,
                                    ignoreFieldChange: true
                                });
                            }
                        }
                    }
                }
                rrRec.commitLine('item');
            }
            rrRec.save({
                enableSourcing: true,
                ignoreMandatoryFields: true
            });
        }
    }
    return {
        afterSubmit: afterSubmit
    };
});