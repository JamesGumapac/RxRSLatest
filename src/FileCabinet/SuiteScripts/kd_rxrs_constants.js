/**
*@NApiVersion 2.x
*/
define([],
function() {
    return {
        RECORDS: {
            RETURN_REQUEST: 'customsale_kod_returnrequest',
            RETURN_ITEM_REQUESTED: 'customrecord_kod_mr_item_request',
            FORM_222_REFERENCE_NUMBER: 'customrecord_kd_222formrefnum'
        },
        RECORDFIELDS: {
            RIR_RETURN_REQUEST: 'custrecord_kd_rir_return_request',
            RIR_222_FORM_REF: 'custrecord_kd_rir_form222_ref',
            F2RN_REF_NUM: 'custrecord_kd_refnum',
            F2RN_PAGE: 'custrecord_kd_form222_page',
            F2RN_RETURN_REQUEST: 'custrecord_kd_returnrequest'
        }
    };
});