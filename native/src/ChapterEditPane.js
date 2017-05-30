/**
 * @flow
 */

import React, { Component } from "react";
import Icon from "react-native-vector-icons/Ionicons";
import { Alert, Text, View } from "react-native";
import PlusButton from "./PlusButton";
import ChapterPane from "./ChapterPane";
import { ListItem } from "react-native-elements";
import { WithZed } from "./ZedStore";

class EditorContent extends Component {
  render() {
    const { chapterState, navigation, setChapterState } = this.props;
    if (!chapterState || !chapterState.components) {
      return <Text>Add something!</Text>;
    }
    const { components } = chapterState;
    const { navigate, state } = navigation;
    const { chapterIndex } = state.params;
    return (
      <View>
        {components.map((c, index) => (
          <ListItem
            title={<Text>{c.name} ({c.type})</Text>}
            key={c.key}
            onPress={() => {
              navigate("EditComponent", {
                chapterIndex,
                context: [c.key]
              });
            }}
            onLongPress={() => {
              Alert.alert(c.type, "", [
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: () => {
                    let changedComponents = chapterState.components.slice();
                    changedComponents.splice(index, 1);
                    setChapterState(chapterIndex, {
                      ...chapterState,
                      components: changedComponents
                    });
                  }
                },
                { text: "Cancel" }
              ]);
            }}
          />
        ))}
      </View>
    );
  }
}

class ChapterEditPaneWithState extends Component {
  render() {
    const { chapterState, navigation } = this.props;
    const { chapterIndex } = navigation.state.params;
    return (
      <ChapterPane
        absolutely={
          <PlusButton
            onPress={() => {
              navigation.navigate("NewComponent", { chapterIndex });
            }}
          />
        }
      >
        <EditorContent {...this.props} />
      </ChapterPane>
    );
  }
}
const ChapterEditPane = WithZed(ChapterEditPaneWithState);

export default ChapterEditPane;
