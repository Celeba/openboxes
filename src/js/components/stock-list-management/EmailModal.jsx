import _ from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Alert from 'react-s-alert';
import { getTranslate } from 'react-localize-redux';

import ModalWrapper from '../form-elements/ModalWrapper';
import TextField from '../form-elements/TextField';
import TextareaField from '../form-elements/TextareaField';
import SelectField from '../form-elements/SelectField';
import apiClient from '../../utils/apiClient';
import { showSpinner, hideSpinner } from '../../actions';
import { translateWithDefaultMessage } from '../../utils/Translate';


const FIELDS = {
  recipients: {
    type: SelectField,
    label: 'react.stockListManagement.recipients.label',
    defaultMessage: 'Recipients',
    attributes: {
      required: true,
      showValueTooltip: true,
      multi: true,
      objectValue: true,
      style: { paddingBottom: 5 },
    },
    getDynamicAttr: ({ users }) => ({
      options: users,
    }),
  },
  subject: {
    type: TextField,
    label: 'react.stockListManagement.subject.label',
    defaultMessage: 'Subject',
    attributes: {
      required: true,
    },
  },
  text: {
    type: TextareaField,
    label: 'react.stockListManagement.message.label',
    defaultMessage: 'Message',
    attributes: {
      rows: 8,
      required: true,
    },
  },
};

function validate(values) {
  const errors = {};
  if (_.isEmpty(values.recipients)) {
    errors.recipients = 'react.default.error.requiredField.label';
  }
  if (!values.subject) {
    errors.subject = 'react.default.error.requiredField.label';
  }
  if (!values.text) {
    errors.text = 'react.default.error.requiredField.label';
  }
  return errors;
}

/** Modal window where user can send email with updated stocklist */
/* eslint no-param-reassign: "error" */
class EmailModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      formValues: {},
    };

    this.onOpen = this.onOpen.bind(this);
    this.onSave = this.onSave.bind(this);
  }

  /**
   * Loads initial form values
   * @public
   */
  onOpen() {
    const { manager } = this.props;
    this.setState({
      formValues: {
        subject: 'STOCK LIST UPDATE',
        text: 'Please find attached a new version of your stock list reflecting' +
          ' recent updates. Please use this version for your next replenishment request.',
        recipients: manager ? [{ id: manager.id, email: manager.email, label: manager.name }] : [],
      },
    });
  }

  /**
   * Sends all changes made by user in this modal to API and updates data.
   * @param {object} values
   * @public
   */
  onSave(values) {
    this.props.showSpinner();

    const url = `/openboxes/api/stocklists/sendMail/${this.props.stocklistId}`;
    const payload = {
      ...values,
      recipients: _.map(_.filter(values.recipients, val => val.email), val => val.email),
    };

    apiClient.post(url, payload)
      .then(() => {
        this.props.hideSpinner();
        Alert.success(this.props.translate('react.stockListManagement.alert.emailSend.label', 'Email sent successfully'), { timeout: 1000 });
      })
      .catch(() => this.props.hideSpinner());
  }

  render() {
    return (
      <ModalWrapper
        title="stockListManagement.sendMailModalTitle.label"
        btnOpenText="react.default.button.email.label"
        btnOpenDefaultText="Email"
        btnSaveText="react.default.button.send.label"
        btnSaveDefaultText="Send"
        btnOpenClassName="btn btn-outline-secondary btn-xs mr-1"
        onOpen={this.onOpen}
        onSave={this.onSave}
        fields={FIELDS}
        initialValues={this.state.formValues}
        formProps={{ users: this.props.users }}
        validate={validate}
      />
    );
  }
}

const mapStateToProps = state => ({
  translate: translateWithDefaultMessage(getTranslate(state.localize)),
});

export default connect(mapStateToProps, { showSpinner, hideSpinner })(EmailModal);

EmailModal.propTypes = {
  /** Function called when data is loading */
  showSpinner: PropTypes.func.isRequired,
  /** Function called when data has loaded */
  hideSpinner: PropTypes.func.isRequired,
  /** Id of stocklist */
  stocklistId: PropTypes.string.isRequired,
  /** Array of available users  */
  users: PropTypes.arrayOf(PropTypes.shape({})),
  manager: PropTypes.shape({}),
  /** Function used to translate static messages */
  translate: PropTypes.func.isRequired,
};

EmailModal.defaultProps = {
  users: [],
  manager: null,
};
