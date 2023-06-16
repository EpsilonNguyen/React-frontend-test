import React, { Component } from 'react';
import { connect } from 'react-redux';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';
import './ManageDoctor.scss';
import Select from 'react-select';
import * as actions from '../../../store/actions'
import { LANGUAGES, CRUD_ACTIONS } from '../../../utils';
import { getInforDoctorById } from '../../../services/userService';
import { FormattedMessage } from 'react-intl';
import _ from 'lodash';

// const options = [
//     { value: 'chocolate', label: 'Chocolate' },
//     { value: 'strawberry', label: 'Strawberry' },
//     { value: 'vanilla', label: 'Vanilla' },
// ];

const mdParser = new MarkdownIt(/* Markdown-it options */);

class ManageDoctor extends Component {

    constructor(props) {
        super(props);
        this.state = {
            // save to Markdown table
            contentHTML: '',
            contentMarkdown: '',
            description: '',
            selectedOption: '',
            listDoctor: [],
            hasOldData: false,

            // save to doctor_infor table
            listPrice: [],
            listPayment: [],
            listProvince: [],
            listClinic: [],
            listSpecialty: [],

            selectedPrice: '',
            selectedPayment: '',
            selectedProvince: '',
            selectedClinic: '',
            selectedSpecialty: '',

            nameClinic: '',
            addressClinic: '',
            note: '',
            clinicId: '',
            specialtyId: ''
        }
    }

    componentDidMount() {
        this.props.getAllDoctors();
        this.props.getAllRequiredDoctorInfor();
        console.log(">>> check props: ", this.props.allRequiredDoctorInfor)
    }

    componentDidUpdate(prevProps, prevState, snapshot) {
        if (prevProps.doctorsRedux !== this.props.doctorsRedux) {
            let dataSelect = this.buildDataInputSelect(this.props.doctorsRedux, 'USERS')
            this.setState({
                listDoctor: dataSelect
            })
        }

        if (prevProps.language !== this.props.language) {
            let dataSelect = this.buildDataInputSelect(this.props.doctorsRedux, 'USERS');
            let { resPayment, resPrice, resProvince } = this.props.allRequiredDoctorInfor;
            let dataSelectPrice = this.buildDataInputSelect(resPrice, 'PRICE');
            let dataSelectPayment = this.buildDataInputSelect(resPayment, 'PAYMENT');
            let dataSelectProvince = this.buildDataInputSelect(resProvince, 'PROVINCE');

            this.setState({
                listDoctor: dataSelect,
                listPrice: dataSelectPrice,
                listPayment: dataSelectPayment,
                listProvince: dataSelectProvince
            })
        }

        if (prevProps.allRequiredDoctorInfor !== this.props.allRequiredDoctorInfor) {
            let { resPayment, resPrice, resProvince, resSpecialty, resClinic } = this.props.allRequiredDoctorInfor;

            let dataSelectPrice = this.buildDataInputSelect(resPrice, 'PRICE');
            let dataSelectPayment = this.buildDataInputSelect(resPayment, 'PAYMENT');
            let dataSelectProvince = this.buildDataInputSelect(resProvince, 'PROVINCE');
            let dataSelectSpecialty = this.buildDataInputSelect(resSpecialty, 'SPECIALTY')
            let dataSelectClinic = this.buildDataInputSelect(resClinic, 'CLINIC');

            this.setState({
                listPayment: dataSelectPayment,
                listPrice: dataSelectPrice,
                listProvince: dataSelectProvince,
                listSpecialty: dataSelectSpecialty,
                listClinic: dataSelectClinic
            })
        }
    }

    buildDataInputSelect = (data, type) => {
        let result = [];
        let { language } = this.props;
        if (data && data.length > 0) {
            if (type === 'USERS') {
                data.map((item, index) => {
                    let object = {};
                    let labelVi = `${item.lastName} ${item.firstName}`;
                    let labelEn = `${item.firstName} ${item.lastName}`;
                    object.label = language === LANGUAGES.VI ? labelVi : labelEn;
                    object.value = item.id;
                    result.push(object);
                })
            }

            if (type === 'PRICE') {
                data.map((item, index) => {
                    let object = {};
                    let labelVi = `${item.valueVi}`;
                    let labelEn = `${item.valueEn} USD`;
                    object.label = language === LANGUAGES.VI ? labelVi : labelEn;
                    object.value = item.keyMap;
                    result.push(object);
                })
            }

            if (type === 'PAYMENT' || type === 'PROVINCE') {
                data.map((item, index) => {
                    let object = {};
                    let labelVi = `${item.valueVi}`;
                    let labelEn = `${item.valueEn}`;
                    object.label = language === LANGUAGES.VI ? labelVi : labelEn;
                    object.value = item.keyMap;
                    result.push(object);
                })
            }

            if (type === 'SPECIALTY' || type === 'CLINIC') {
                data.map((item, index) => {
                    let object = {};
                    object.label = item.name;
                    object.value = item.id;
                    result.push(object);
                })
            }
        }
        return result;
    }

    handleEditorChange = ({ html, text }) => {
        this.setState({
            contentHTML: html,
            contentMarkdown: text
        })
    }

    handleSaveContentMarkdown = () => {
        let { hasOldData } = this.state;
        this.props.saveDetailDoctor({
            contentHTML: this.state.contentHTML,
            contentMarkdown: this.state.contentMarkdown,
            description: this.state.description,
            doctorId: this.state.selectedOption.value,
            action: hasOldData === true ? CRUD_ACTIONS.EDIT : CRUD_ACTIONS.CREATE,

            selectedPrice: this.state.selectedPrice.value,
            selectedProvince: this.state.selectedProvince.value,
            selectedPayment: this.state.selectedPayment.value,
            nameClinic: this.state.nameClinic,
            addressClinic: this.state.addressClinic,
            note: this.state.note,
            clinicId: this.state.selectedClinic.value,
            specialtyId: this.state.selectedSpecialty.value
        });
    }

    handleChangeSelectDoctorInfor = async (selectedOption, name) => {
        let stateName = name.name;
        let stateCopy = { ... this.state };
        stateCopy[stateName] = selectedOption;
        this.setState({
            ...stateCopy
        })
    }

    handleOnChangeText = (event, id) => {
        let stateCopy = { ... this.state };
        stateCopy[id] = event.target.value;
        this.setState({
            ...stateCopy
        })
    }

    handleChangeSelect = async (selectedOption) => {
        this.setState({
            selectedOption: selectedOption,
        });
        let { listPayment, listPrice, listProvince, listSpecialty, listClinic } = this.state;

        let res = await getInforDoctorById(selectedOption.value);

        if (res && res.errCode === 0 && res.data && res.data.Markdown &&
            !_.isEmpty(res.data.Markdown.description) && !_.isEmpty(res.data.Markdown.contentHTML)
            && !_.isEmpty(res.data.Markdown.contentMarkdown)) {
            let markdown = res.data.Markdown;

            let addressClinic = '', nameClinic = '', note = '',
                paymentId = '', priceId = '', provinceId = '', specialtyId = '', clinicId = '',
                selectedPayment = '', selectedPrice = '', selectedProvince = '', selectedSpecialty = '', selectedClinic = '';

            if (res.data.Doctor_Infor) {
                addressClinic = res.data.Doctor_Infor.addressClinic;
                nameClinic = res.data.Doctor_Infor.nameClinic;
                note = res.data.Doctor_Infor.note;
                paymentId = res.data.Doctor_Infor.paymentId;
                priceId = res.data.Doctor_Infor.priceId;
                provinceId = res.data.Doctor_Infor.provinceId;
                specialtyId = res.data.Doctor_Infor.specialtyId;
                clinicId = res.data.Doctor_Infor.clinicId;

                selectedPayment = listPayment.find(item => {
                    return item && item.value === paymentId
                })

                selectedPrice = listPrice.find(item => {
                    return item && item.value === priceId
                })

                selectedProvince = listProvince.find(item => {
                    return item && item.value === provinceId
                })

                selectedSpecialty = listSpecialty.find(item => {
                    return item && item.value === specialtyId
                })

                selectedClinic = listClinic.find(item => {
                    return item && item.value === clinicId
                })
            }

            this.setState({
                contentHTML: markdown.contentHTML,
                contentMarkdown: markdown.contentMarkdown,
                description: markdown.description,
                hasOldData: true,
                addressClinic: addressClinic,
                nameClinic: nameClinic,
                note: note,
                selectedPrice: selectedPrice,
                selectedPayment: selectedPayment,
                selectedProvince: selectedProvince,
                selectedSpecialty: selectedSpecialty,
                selectedClinic: selectedClinic
            })
        } else {
            this.setState({
                contentHTML: '',
                contentMarkdown: '',
                description: '',
                hasOldData: false,
                addressClinic: '',
                nameClinic: '',
                note: '',
                selectedPayment: '',
                selectedPrice: '',
                selectedProvince: '',
                selectedSpecialty: '',
                selectedClinic: '',
            })
        }
    }

    render() {
        let { hasOldData } = this.state;

        return (
            <div className='manage-doctor-container'>
                <div className='manage-doctor-title'>
                    <FormattedMessage id='admin.manage-doctor.title' />
                </div>
                <div className='more-infor'>
                    <div className='content-left form-group'>
                        <label><FormattedMessage id='admin.manage-doctor.select-doctor' /></label>

                        <Select
                            value={this.state.selectedOption}
                            onChange={this.handleChangeSelect}
                            options={this.state.listDoctor}
                            placeholder={<FormattedMessage id='admin.manage-doctor.select-doctor' />}
                        />

                    </div>
                    <div className='content-right'>
                        <label><FormattedMessage id='admin.manage-doctor.intro' /></label>
                        <textarea className='form-control' rows='4'
                            onChange={(event) => { this.handleOnChangeText(event, 'description') }}
                            value={this.state.description}>
                        </textarea>
                    </div>
                </div>

                <div className='more-infor-extra row'>
                    <div className='col-4 form-group'>
                        <label><FormattedMessage id='admin.manage-doctor.price' /></label>
                        <Select
                            value={this.state.selectedPrice}
                            onChange={this.handleChangeSelectDoctorInfor}
                            options={this.state.listPrice}
                            placeholder={<FormattedMessage id='admin.manage-doctor.price' />}
                            name='selectedPrice'
                        />
                    </div>
                    <div className='col-4 form-group'>
                        <label><FormattedMessage id='admin.manage-doctor.payment' /></label>
                        <Select
                            value={this.state.selectedPayment}
                            onChange={this.handleChangeSelectDoctorInfor}
                            options={this.state.listPayment}
                            placeholder={<FormattedMessage id='admin.manage-doctor.payment' />}
                            name='selectedPayment'
                        />
                    </div>
                    <div className='col-4 form-group'>
                        <label><FormattedMessage id='admin.manage-doctor.province' /></label>
                        <Select
                            value={this.state.selectedProvince}
                            onChange={this.handleChangeSelectDoctorInfor}
                            options={this.state.listProvince}
                            placeholder={<FormattedMessage id='admin.manage-doctor.province' />}
                            name='selectedProvince'
                        />
                    </div>

                    <div className='col-4 form-group'>
                        <label><FormattedMessage id='admin.manage-doctor.nameClinic' /></label>
                        <input className='form-control'
                            onChange={(event) => { this.handleOnChangeText(event, 'nameClinic') }}
                            value={this.state.nameClinic}
                        />
                    </div>
                    <div className='col-4 form-group'>
                        <label><FormattedMessage id='admin.manage-doctor.addressClinic' /></label>
                        <input className='form-control'
                            onChange={(event) => { this.handleOnChangeText(event, 'addressClinic') }}
                            value={this.state.addressClinic}
                        />
                    </div>
                    <div className='col-4 form-group'>
                        <label><FormattedMessage id='admin.manage-doctor.note' /></label>
                        <input className='form-control'
                            onChange={(event) => { this.handleOnChangeText(event, 'note') }}
                            value={this.state.note}
                        />
                    </div>
                </div>

                <div className='row'>
                    <div className='col-4 form-group'>
                        <label><FormattedMessage id='admin.manage-doctor.specialty' /></label>
                        <Select
                            value={this.state.selectedSpecialty}
                            onChange={this.handleChangeSelectDoctorInfor}
                            options={this.state.listSpecialty}
                            placeholder={<FormattedMessage id='admin.manage-doctor.specialty' />}
                            name='selectedSpecialty'
                        />
                    </div>
                    <div className='col-4 form-group'>
                        <label><FormattedMessage id='admin.manage-doctor.clinic' /></label>
                        <Select
                            value={this.state.selectedClinic}
                            onChange={this.handleChangeSelectDoctorInfor}
                            options={this.state.listClinic}
                            placeholder={<FormattedMessage id='admin.manage-doctor.clinic' />}
                            name='selectedClinic'
                        />
                    </div>
                </div>

                <div className='manage-doctor-editor'>
                    <MdEditor
                        style={{ height: '300px' }}
                        renderHTML={text => mdParser.render(text)}
                        onChange={this.handleEditorChange}
                        value={this.state.contentMarkdown} />
                </div>
                <button className={hasOldData === true ? 'save-content-doctor' : 'create-content-doctor'}
                    onClick={() => { this.handleSaveContentMarkdown() }}>
                    {hasOldData === true ?
                        <span><FormattedMessage id='admin.manage-doctor.save' /></span>
                        :
                        <span><FormattedMessage id='admin.manage-doctor.add' /></span>
                    }
                </button>
            </div>
        );
    }

}

const mapStateToProps = state => {
    return {
        isLoggedIn: state.user.isLoggedIn,
        language: state.app.language,
        doctorsRedux: state.admin.doctors,
        allRequiredDoctorInfor: state.admin.allRequiredDoctorInfor
    };
};

const mapDispatchToProps = dispatch => {
    return {
        getAllDoctors: () => dispatch(actions.fetchAllDoctors()),
        getAllRequiredDoctorInfor: () => dispatch(actions.getRequiredDoctorInfor()),
        saveDetailDoctor: (data) => dispatch(actions.saveDetailDoctor(data))
    };
};

export default connect(mapStateToProps, mapDispatchToProps)(ManageDoctor);
