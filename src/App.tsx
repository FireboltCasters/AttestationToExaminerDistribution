import React from 'react';

import "primereact/resources/themes/lara-light-indigo/theme.css";  //theme
import "primereact/resources/primereact.min.css";                  //core css
import "primeicons/primeicons.css";
import {AttestationToExaminerDistribution} from "./ignoreCoverage/flow/AttestationToExaminerDistribution";
import {I18nProvider} from "./ignoreCoverage/i18n/I18n";

export default class App extends React.Component<any, any> {

  render(){
    return (
        <I18nProvider>
          <AttestationToExaminerDistribution />
        </I18nProvider>
    );
  }
}
