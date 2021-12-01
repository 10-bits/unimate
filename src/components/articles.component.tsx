import {Button, List, Text} from '@ui-kitten/components';
import React from 'react';
import {
  ImageBackground,
  ListRenderItemInfo,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {Article} from '../models/article';
import {WebBrowserService} from '../services/web-browser.service';

const data: Article[] = [
  Article.one(),
  Article.one(),
  Article.two(),
  Article.three(),
  Article.four(),
];

const [...listArticles] = data;

export default ({navigation}): React.ReactElement => {
  const isItemReverse = (index: number): boolean => {
    return index % 2 === 1;
  };

  const renderArticleItem = (
    info: ListRenderItemInfo<Article>,
  ): React.ReactElement => (
    <TouchableOpacity
      style={[styles.item, isItemReverse(info.index) && styles.itemReverse]}
      activeOpacity={0.95}
      //onPress={() => onItemPress(info.index + 1)}>
      onPress={() => WebBrowserService.openBrowserAsync(info.item.website)}>
      <ImageBackground style={styles.itemSection} source={info.item.image} />
      <View style={styles.itemSection}>
        <Text style={styles.itemTitle} category="h6">
          {info.item.title}
        </Text>
        <View style={styles.footer}>
          <Button
            style={styles.readButtonFull}
            onPress={() =>
              WebBrowserService.openBrowserAsync(info.item.website)
            }>
            Read More
          </Button>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <List
      style={styles.list}
      data={listArticles}
      renderItem={renderArticleItem}
    />
  );
};

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  readButton: {
    width: '50%',
    marginTop: 32,
  },
  readButtonFull: {
    width: '100%',
    marginTop: 32,
  },
  headingArticleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    height: 320,
  },
  headingArticleTitle: {
    zIndex: 1,
    textAlign: 'center',
  },
  headingArticleDescription: {
    zIndex: 1,
  },
  item: {
    flexDirection: 'row',
    minHeight: 188,
  },
  itemReverse: {
    flexDirection: 'row-reverse',
  },
  itemSection: {
    flex: 1,
    padding: 16,
  },
  footer: {
    flexDirection: 'row',
  },
  itemTitle: {
    flex: 1,
  },
  iconButton: {
    paddingHorizontal: 0,
  },
});
