/**
 *@NApiVersion 2.x
 *@NScriptType ClientScript
 */
define([],
function() {
    var FLD_IT_CONTROL_TYPE = 'custitem_kod_itemcontrol'
    var FLD_IT_CONTROL_NUMBER = 'custitem_kd_control_number';
    var IT_CONTROL_TYPE_RX_OTC = 1;
    var IT_CONTROL_TYPE_C2 = 3;
    var IT_CONTROL_TYPE_C3_5 = 4;
    var IT_CONTROL_TYPE_C1 = 7;
    function fieldChanged(context) {
        var currentRecord = context.currentRecord;
        log.debug('TEST', context.fieldId);
        if(context.fieldId == FLD_IT_CONTROL_NUMBER){
            var controlNumber = currentRecord.getValue(FLD_IT_CONTROL_NUMBER);
            log.debug('TEST', 'controlNumber: ' + controlNumber);
            var controlType = '';
            switch(controlNumber) {
                case '1':
                  controlType = IT_CONTROL_TYPE_RX_OTC;
                  break;
                case '2':
                    controlType = IT_CONTROL_TYPE_C1;
                    break;
                case '3':
                  controlType = IT_CONTROL_TYPE_C2;
                  break;
                case '4':
                case '5':
                case '6':
                    controlType = IT_CONTROL_TYPE_C3_5;
                    break;
                default:
                    controlType = '';
                  // code block
            }
            log.debug('TEST', 'controlType: ' + controlType);
            //if(controlType != ''){
                currentRecord.setValue({
                    fieldId: FLD_IT_CONTROL_TYPE,
                    value: controlType
                });
            //}     
        }
    }
    return {
        fieldChanged: fieldChanged
    };
});