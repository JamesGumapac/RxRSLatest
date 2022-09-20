/**
 *@NApiVersion 2.x
*@NScriptType UserEventScript
*/
define(['N/record', 'N/search'],
function(record, search) {
    var REC_RETURN_REQUEST = 'customsale_kod_returnrequest';
    var REC_RETURN_ITEM_REQUESTED = 'customrecord_kod_mr_item_request';
    var REC_222_FORM_REFERENCE_NUMBER = 'customrecord_kd_222formrefnum';
    var FLD_RIR_MRR = 'custrecord_kd_rir_masterid';
    var FLD_RIR_LINE_ID = 'custrecord_kd_rir_lineid';
    var FLD_RIR_ITEM = 'custrecord_kd_rir_item';
    var FLD_RIR_QUANTITY = 'custrecord_kd_rir_quantity';
    var FLD_RIR_FULL_PARTIAL_PACKAGE = 'custrecord_kd_rir_fulpar';
    var FLD_RIR_LOT_NUMBER = 'custrecord_kd_rir_lotnumber';
    var FLD_RIR_LOT_EXPIRATION = 'custrecord_kd_rir_lotexp';
    var FLD_RIR_MANUFACTURER = 'custrecord_kd_ri_manufacturer';
    var FLD_RIR_FORM_222_REF_NUM = 'custrecord_kd_rir_form222_ref';
    var FLD_RIR_FORM_PAGE = 'custrecord_kd_rir_form_222_no';
    var FLD_RIR_RR = 'custrecord_kd_rir_return_request';
    var FLD_RIR_CATEGORY = 'custrecord_kd_rir_category';
    var CATEGORY_C2 = 3;
    function getReturnItemRequestedCount(rrId){
        var rirCountSearch = search.create({
            type: REC_RETURN_ITEM_REQUESTED,
            columns: [search.createColumn({
                name: 'internalid',
                summary: search.Summary.COUNT
            })],
            filters: [{
                name: FLD_RIR_RR,
                operator: 'anyof',
                values: [rrId]
            },{
                name: FLD_RIR_CATEGORY,
                operator: 'anyof',
                values: CATEGORY_C2
            }]
        });
        var rs = rirCountSearch.run().getRange(0,1);
        var rirCount = rs[0].getValue({name: 'internalid', summary: search.Summary.COUNT});
        log.debug('getReturnItemRequestedCount', 'RIR COUNT: ' + rirCount);
        return rirCount;
    }
    function isRecordChanged(oldRec, newRec){
        if( oldRec.getValue(FLD_RIR_MRR) != newRec.getValue(FLD_RIR_MRR) ||
            oldRec.getValue(FLD_RIR_LINE_ID) != newRec.getValue(FLD_RIR_LINE_ID) ||
            oldRec.getValue(FLD_RIR_ITEM) != newRec.getValue(FLD_RIR_ITEM) ||
            oldRec.getValue(FLD_RIR_QUANTITY) != newRec.getValue(FLD_RIR_QUANTITY) ||
            oldRec.getValue(FLD_RIR_FULL_PARTIAL_PACKAGE) != newRec.getValue(FLD_RIR_FULL_PARTIAL_PACKAGE) ||
            oldRec.getValue(FLD_RIR_LOT_NUMBER) != newRec.getValue(FLD_RIR_LOT_NUMBER) ||
            oldRec.getValue(FLD_RIR_LOT_EXPIRATION) != newRec.getValue(FLD_RIR_LOT_EXPIRATION) ||
            oldRec.getValue(FLD_RIR_MANUFACTURER) != newRec.getValue(FLD_RIR_MANUFACTURER) ||
            oldRec.getValue(FLD_RIR_FORM_222_REF_NUM) != newRec.getValue(FLD_RIR_FORM_222_REF_NUM)
        ){
            return true;
        }
        return false;
    }
    function is222FormRefForRegeneration(f2rnId){
          try {
  var fieldLookUp = search.lookupFields({
            type: REC_222_FORM_REFERENCE_NUMBER,
            id: f2rnId,
            columns: ['custrecord_kd_2frn_222_form_pdf']
        });
        //log.debug('is222FormRefForRegeneration', fieldLookUp['custrecord_kd_2frn_222_form_pdf'][0].text)
        if(fieldLookUp['custrecord_kd_2frn_222_form_pdf'].length > 0 && fieldLookUp['custrecord_kd_2frn_222_form_pdf'][0].text != '')
            return true;
        return false;
                    } catch (e) {
                        log.error(e.message)
                    }
      
    }
    function getF2rnPage(f2rnId){
        if(f2rnId == null || f2rnId == '')
            return '';
        var fieldLookUp = search.lookupFields({
            type: REC_222_FORM_REFERENCE_NUMBER,
            id: f2rnId,
            columns: ['custrecord_kd_form222_page']
        });
        log.debug('getF2rnPage', fieldLookUp['custrecord_kd_form222_page'][0])
        return fieldLookUp['custrecord_kd_form222_page'][0];
    }
    function afterSubmit(context) {
        if (context.type == context.UserEventType.CREATE || context.type == context.UserEventType.COPY || context.type == context.UserEventType.DELETE){
            var rrId = context.newRecord.getValue(FLD_RIR_RR);
            var rirCount = getReturnItemRequestedCount(rrId);
            var noOfForm222 = Math.ceil(parseInt(rirCount)/parseInt(4));
            record.submitFields({
                type: REC_RETURN_REQUEST,
                id: rrId,
                values: {
                    custbody_kd_no_form_222: noOfForm222
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields : true
                }
            });
            record.submitFields({
                type: REC_RETURN_ITEM_REQUESTED,
                id: context.newRecord.id,
                values: {
                    custrecord_kd_rir_form_222_no: getF2rnPage(context.newRecord.getValue(FLD_RIR_FORM_222_REF_NUM))
                },
                options: {
                    enableSourcing: false,
                    ignoreMandatoryFields : true
                }
            });
        } else if (context.type == context.UserEventType.EDIT) {
            log.debug('TEST', 'old record: ' + JSON.stringify(context.oldRecord));
            log.debug('TEST', 'new record: ' + JSON.stringify(context.newRecord));
            if(isRecordChanged(context.oldRecord, context.newRecord)){
              log.debug('TEST', '2FRN to flag');
              log.debug('TEST AND DELETE', context.newRecord.getValue(FLD_RIR_FORM_222_REF_NUM) != '');
              if(context.newRecord.getValue(FLD_RIR_FORM_222_REF_NUM) != '') log.debug('TEST AND DELETE', is222FormRefForRegeneration(context.newRecord.getValue(FLD_RIR_FORM_222_REF_NUM)));
                if(context.newRecord.getValue(FLD_RIR_FORM_222_REF_NUM) != '' && is222FormRefForRegeneration(context.newRecord.getValue(FLD_RIR_FORM_222_REF_NUM))){
                  log.debug('TEST', 'new record to be flagged ' + context.newRecord.getValue(FLD_RIR_FORM_222_REF_NUM));
                    record.submitFields({
                        type: REC_222_FORM_REFERENCE_NUMBER,
                        id: context.newRecord.getValue(FLD_RIR_FORM_222_REF_NUM),
                        values: {
                            custrecord_kd_2frn_for_222_regeneration: true
                        }
                    });
                }
                if(context.oldRecord.getValue(FLD_RIR_FORM_222_REF_NUM) != context.newRecord.getValue(FLD_RIR_FORM_222_REF_NUM) && is222FormRefForRegeneration(context.oldRecord.getValue(FLD_RIR_FORM_222_REF_NUM))){
                  log.debug('TEST', 'old record to be flagged ' + context.oldRecord.getValue(FLD_RIR_FORM_222_REF_NUM));
                    record.submitFields({
                        type: REC_222_FORM_REFERENCE_NUMBER,
                        id: context.oldRecord.getValue(FLD_RIR_FORM_222_REF_NUM),
                        values: {
                            custrecord_kd_2frn_for_222_regeneration: true
                        }
                    });
                }
            }
        }
    }
    return {
        afterSubmit: afterSubmit
    };
});