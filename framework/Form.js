({
  React,
  Platform,
  Alert,
  View,
  Button,
  Text,
  TextInput,
  StyleSheet,
  _npm_monaco_editor,
}) => {
  const MonacoEditor = _npm_monaco_editor;
  class JSONEditor extends React.Component {
    editorDidMount(editor, monaco) {
      editor.focus();
    }
    render() {
      const { onValue, value } = this.props;
      return (
        <div
          style={{ width: 400, height: 400, borderWidth: 1 }}
          ref={div => {
            if (!div) {
              this.editor = null;
              return;
            }
            this.editor = _npm_monaco_editor.editor.create(
              div,
              {
                value,
              },
              {},
            );

            this.editor.onDidChangeModelContent(() => {
              const model = this.editor.getModel();
              const content = model.getLinesContent();
              const foobar = content.join("\n");
              console.log(foobar);
              onValue(foobar);
            });
          }}
        />
      );
    }
  }
  class FormField extends React.Component {
    render() {
      const {
        field,
        onValue,
        value,
        type,
        onSubmit,
        doesSubmit,
        onInputRef,
      } = this.props;
      // types:
      // - text
      // - name, autocapitalized text
      // - email
      // - password
      // - number
      // - json
      if (type === "json") {
        return <JSONEditor value={value} onValue={onValue} />;
      }
      const keyboardType =
        type === "email"
          ? "email-address"
          : type === "number" ? "numeric" : "default";
      const autoCapitalize = type === "name" ? "words" : "none";
      const secureTextEntry = type === "password";
      const returnKeyType = doesSubmit ? "done" : "next";
      return (
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>{field.label}</Text>
          <TextInput
            keyboardType={keyboardType}
            value={value || ""}
            autoCapitalize={autoCapitalize}
            onChangeText={onValue}
            style={styles.formInput}
            secureTextEntry={secureTextEntry}
            onSubmitEditing={onSubmit}
            returnKeyType={returnKeyType}
            ref={onInputRef}
          />
        </View>
      );
    }
  }
  const styles = StyleSheet.create({
    fieldContainer: { marginBottom: 10 },
    formContainer: { padding: 30 },
    label: { color: "#222233", marginVertical: 3 },
    formInput: {
      height: 40,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: "#DDDDEE",
      borderRadius: 5,
      padding: 8,
    },
  });
  class Form extends React.Component {
    state = { fields: {} };
    _inputs = {};
    render() {
      return (
        <View style={styles.formContainer}>
          {this.props.fields.map((field, fieldIndex) => {
            const doesSubmit = fieldIndex === this.props.fields.length - 1;
            return (
              <FormField
                field={field}
                key={field.name}
                type={field.type}
                value={this.state.fields[field.name]}
                onValue={value => {
                  this.setState(state => ({
                    fields: { ...state.fields, [field.name]: value },
                  }));
                }}
                doesSubmit={doesSubmit}
                onInputRef={i => {
                  this._inputs[field.name] = i;
                }}
                onSubmit={() => {
                  if (doesSubmit) {
                    this._onSubmit();
                    return;
                  }
                  const nextField = this.props.fields[fieldIndex + 1];
                  if (
                    nextField &&
                    nextField.name &&
                    this._inputs[nextField.name]
                  ) {
                    this._inputs[nextField.name].focus();
                  }
                }}
              />
            );
          })}
          <Button onPress={this._onSubmit} label="Submit" />
        </View>
      );
    }
    _onSubmit = () => {
      this.props.onSubmit(this.state.fields);
    };
  }
  return Form;
};
