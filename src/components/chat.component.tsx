import React from 'react';
import {ListRenderItemInfo, StyleSheet} from 'react-native';
import {List, ListProps, StyleType} from '@ui-kitten/components';
import {ChatMessageContent} from './chat-message-content.component';
import {ChatMessageGroup} from './chat-message-group.component';
import {ChatMessage} from './chat-message.component';
import {ChatService} from './chat.service';
import {Message} from '../models/message';

export interface ChatProps extends Omit<ListProps, 'renderItem'> {
  data: Message[];
  followEnd: boolean;
}

const chatService: ChatService = new ChatService();

export const Chat = (props: ChatProps): React.ReactElement => {
  const listRef: React.RefObject<any> = React.useRef();
  let contentHeight: number = 0;

  const {followEnd, contentContainerStyle, data, ...listProps} = props;

  const shouldShowMessageIndicator = (message: Message): boolean => {
    return message.text && message.text.length > 0;
  };

  const scrollToEnd = (params): void => {
    scrollToOffset({offset: contentHeight, ...params});
  };

  const scrollToIndex = (params): void => {
    listRef.current.scrollToIndex(params);
  };

  const scrollToOffset = (params): void => {
    listRef.current.scrollToOffset(params);
  };

  const onContentSizeChange = (width: number, height: number): void => {
    contentHeight = height;

    props.followEnd && setTimeout(scrollToEnd, 0);

    listProps.onContentSizeChange &&
      listProps.onContentSizeChange(width, height);
  };

  const renderMessageContent = (
    message: Message,
    style: StyleType,
  ): React.ReactElement => (
    <ChatMessageContent style={style.container}>{message}</ChatMessageContent>
  );

  const renderMessage = (message: Message): React.ReactElement => (
    <ChatMessage
      style={styles.message}
      message={message}
      shouldShowIndicator={shouldShowMessageIndicator(message)}>
      {renderMessageContent}
    </ChatMessage>
  );

  const renderMessageGroup = (
    info: ListRenderItemInfo<Message[]>,
  ): React.ReactElement => (
    <ChatMessageGroup
      style={styles.group}
      data={info.item}
      renderItem={renderMessage}
    />
  );

  return (
    <List
      ref={listRef}
      {...listProps}
      data={chatService.createMessageGroups(data)}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      onContentSizeChange={onContentSizeChange}
      renderItem={renderMessageGroup}
    />
  );
};

const styles = StyleSheet.create({
  contentContainer: {
    justifyContent: 'flex-end',
  },
  group: {
    marginVertical: 0,
  },
  message: {
    marginVertical: 4,
  },
});
