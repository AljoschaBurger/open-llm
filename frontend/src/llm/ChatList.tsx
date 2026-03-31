import React from "react";
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { atomDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ChatList = React.memo(({ history, messagesEndRef, handleScroll }: any) => {
  return (
    <div ref={messagesEndRef} onScroll={handleScroll} className="flex mt-5 flex-col flex-1 overflow-y-auto w-[70%] p-3 space-y-4 bg-gray-transparent rounded-xl border-white border shadow-md shadow-fuchsia-500">
      {history.map((item: any) => (
        <MessageItem key={item.id} item={item} />
      ))}
    </div>
  );
});

// Auch die einzelnen Items memoisieren!
const MessageItem = React.memo(({ item }: any) => {
  return (
    <div className={`p-3 rounded-lg w-[80%]  ${item.type === "prompt" ? "bg-purple-500 text-white self-end" : "bg-gray-200 text-gray-800 self-start"}`}>
      <div className="font-extrabold text-sm mb-1">
        {item.type === "prompt" ? "You" : "Open-llm"}
      </div>
                          {
                            item.content !== "" ? (
                              <div className="w-full min-w-0">
                                <ReactMarkdown
                                remarkPlugins={[remarkMath]}
                                rehypePlugins={[rehypeKatex]}
                                children={item.content}
                                components={{ 
                                  code({ node, inline, className, children, ...props }: any) {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return !inline && match ? (
                                      <SyntaxHighlighter
                                        children={String(children).replace(/\n$/, '')}
                                        style={atomDark} // Theme
                                        language={match[1]}
                                        PreTag="div"
                                        {...props}
                                        customStyle={{
                                          marginTop: '2rem',
                                          marginBottom: '2rem',
                                          padding: '1rem',
                                          fontSize: 'o.875rem',
                                          lineHeight: '1.25rem',

                                        }}
                                        className="overflow-x-auto"
                                      />
                                    ) : (
                                      <code className={className} {...props}>
                                        {children}
                                      </code>
                                    );
                                  }
                                }}
                              />
                              </div>
                            ) : (
                              <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-fuchsia-600"></div>
                            )
                          }
                        </div>
  );
});

export default ChatList;