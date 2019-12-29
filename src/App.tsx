import React, {
  createContext,
  ReactNode,
  useMemo,
  useContext,
  useState,
  useEffect,
} from 'react'
import './App.css'
import exampleTree from './example-trees/dtinth.json'

/**
 * @see https://chromedevtools.github.io/devtools-protocol/tot/Accessibility
 */
type Node = {
  nodeId: string
  ignored: boolean
  role?: AXValue
  name?: AXValue
  description?: AXValue
  value?: AXValue
  properties?: AXProperty[]
  childIds?: string[]
}
type AXProperty = {
  name: AXPropertyName
  value: AXValue
}
type AXPropertyName =
  | 'busy'
  | 'disabled'
  | 'editable'
  | 'focusable'
  | 'focused'
  | 'hidden'
  | 'hiddenRoot'
  | 'invalid'
  | 'keyshortcuts'
  | 'settable'
  | 'roledescription'
  | 'live'
  | 'atomic'
  | 'relevant'
  | 'root'
  | 'autocomplete'
  | 'hasPopup'
  | 'level'
  | 'multiselectable'
  | 'orientation'
  | 'multiline'
  | 'readonly'
  | 'required'
  | 'valuemin'
  | 'valuemax'
  | 'valuetext'
  | 'checked'
  | 'expanded'
  | 'modal'
  | 'pressed'
  | 'selected'
  | 'activedescendant'
  | 'controls'
  | 'describedby'
  | 'details'
  | 'errormessage'
  | 'flowto'
  | 'labelledby'
  | 'owns'
type AXValue = {
  type:
    | 'boolean'
    | 'tristate'
    | 'booleanOrUndefined'
    | 'idref'
    | 'idrefList'
    | 'integer'
    | 'node'
    | 'nodeList'
    | 'number'
    | 'string'
    | 'computedString'
    | 'token'
    | 'tokenList'
    | 'domRelation'
    | 'role'
    | 'internalRole'
    | 'valueUndefined'
  value?: any
}
type Tree = {
  nodes: Node[]
}
type TreeContext = {
  nodeMap: Map<string, Node>
  rootNodeId: string
}

const TreeContext = createContext<TreeContext | null>(null)
const LinkContext = createContext(false)

const TreeProvider = (props: {
  tree: Tree
  children: (context: TreeContext) => ReactNode
}) => {
  const tree = props.tree
  const context = useMemo(() => {
    return {
      nodeMap: new Map(tree.nodes.map(node => [node.nodeId, node])),
      rootNodeId: tree.nodes[0].nodeId,
    }
  }, [tree])
  return (
    <TreeContext.Provider value={context}>
      {props.children(context)}
    </TreeContext.Provider>
  )
}

function useTreeContext() {
  const context = useContext(TreeContext)
  if (!context) throw new Error('No context')
  return context
}

const isText = (node: Node | undefined) =>
  !!(node && node.role && node.role.value === 'text')

const joinWords = (words: (string | undefined)[]) => {
  return words.filter(x => x).join(', ')
}
const Tree = (props: { nodeId: string }): JSX.Element => {
  const { nodeId } = props
  const nodeMap = useTreeContext().nodeMap
  const node = nodeMap.get(nodeId)
  if (!node) {
    return renderError(`Cannot find node ${nodeId}`)
  }
  if (!node.role) {
    return renderError(`Node ${nodeId} has no role`)
  }
  if (node.ignored) {
    return <></>
  }
  const role = node.role.value
  const getName = () => String(node.name && node.name.value)
  const renderChildren = () =>
    (node.childIds || []).map((childId, index, childIds) => (
      <>
        {index > 0 &&
          isText(nodeMap.get(childIds[index - 1])) &&
          isText(nodeMap.get(childId)) &&
          ' '}
        <Tree nodeId={childId} key={childId} />
      </>
    ))
  const getProperty = (name: AXPropertyName) => {
    const found = (node.properties || []).find(p => p.name === name)
    return found && found.value && found.value.value
  }
  if (getProperty('hidden')) {
    return <></>
  }
  const getStateText = () => {
    const out = []
    const addBooleanState = (
      prop: undefined | boolean,
      onTrue: string,
      onFalse: string,
    ) => {
      if (prop === true) out.push(onTrue)
      if (prop === false) out.push(onFalse)
    }
    const addTristate = (
      prop: undefined | 'true' | 'false',
      onTrue: string,
      onFalse: string,
    ) => {
      if (prop === 'true') out.push(onTrue)
      if (prop === 'false') out.push(onFalse)
    }
    addBooleanState(getProperty('expanded'), 'expanded ', 'collapsed ')
    addTristate(getProperty('checked'), 'checked ', 'unchecked ')
    if (getProperty('hasPopup')) {
      out.push(`${getProperty('hasPopup')} pop-up `)
    }
    return out.join('')
  }
  switch (role) {
    case 'WebArea': {
      return (
        <Block type={joinWords([getName(), 'web content'])}>
          {renderChildren()}
        </Block>
      )
    }
    case 'SVGRoot': {
      return <></>
    }
    case 'LineBreak': {
      return <br />
    }
    case 'GenericContainer':
    case 'generic':
    case 'LayoutTable':
    case 'form':
    case 'Details':
    case 'Label':
    case 'dialog':
    case 'DescriptionListTerm':
    case 'DescriptionListDetail':
    case 'Anchor': {
      return <>{renderChildren()}</>
    }
    case 'strong': {
      return <strong>{renderChildren()}</strong>
    }
    case 'banner': {
      return (
        <Block type={joinWords([getName(), 'banner'])}>
          {renderChildren()}
        </Block>
      )
    }
    case 'main': {
      return (
        <Block type={joinWords([getName(), 'main'])}>{renderChildren()}</Block>
      )
    }
    case 'group': {
      return (
        <Block type={joinWords([getName(), 'group'])}>{renderChildren()}</Block>
      )
    }
    case 'article': {
      return (
        <Block type={joinWords([getName(), 'article'])}>
          {renderChildren()}
        </Block>
      )
    }
    case 'contentinfo': {
      return (
        <Block type={joinWords([getName(), 'content information'])}>
          {renderChildren()}
        </Block>
      )
    }
    case 'navigation': {
      return (
        <Block type={joinWords([getName(), 'navigation'])}>
          {renderChildren()}
        </Block>
      )
    }
    case 'search': {
      return (
        <Block type={joinWords([getName(), 'search'])}>
          {renderChildren()}
        </Block>
      )
    }
    case 'table': {
      // TODO: "table M column, N rows"
      return (
        <Block type={joinWords([getName(), 'table'])}>{renderChildren()}</Block>
      )
    }
    case 'DescriptionList': {
      return (
        <Block type={joinWords([getName(), 'definition list'])}>
          {renderChildren()}
        </Block>
      )
    }
    case 'figure':
    case 'Pre': {
      return <div>{renderChildren()}</div>
    }
    case 'paragraph': {
      return <p>{renderChildren()}</p>
    }
    case 'text': {
      return <> {getName()}</>
    }
    case 'heading': {
      const level = getProperty('level') || 6
      const H: any = `h${level}`
      return (
        <div>
          <H>{renderChildren()}</H>
        </div>
      )
    }
    case 'link': {
      return (
        <LinkContext.Provider value={true}>
          <Span type={getStateText() + 'link'}>{renderChildren()}</Span>
        </LinkContext.Provider>
      )
    }
    case 'button': {
      return (
        <Span type={getStateText() + 'button'} placement="after">
          {getName()}
        </Span>
      )
    }
    case 'checkbox': {
      return (
        <Span type={getStateText() + 'checkbox'} placement="after">
          {getName()}
        </Span>
      )
    }
    case 'combobox': {
      return (
        <Span type={getStateText() + 'combobox'} placement="after">
          {getName()}
        </Span>
      )
    }
    case 'DisclosureTriangle': {
      return (
        <Span type={getStateText() + 'disclosure triangle'} placement="after">
          {renderChildren()}
        </Span>
      )
    }
    case 'textbox': {
      return (
        <Span type={getStateText() + 'edit text'} placement="after">
          {getName()}
        </Span>
      )
    }
    case 'img': {
      return (
        <LinkContext.Consumer>
          {inLink => (
            <Span type="image" placement={inLink ? 'before' : 'after'}>
              {getName()}
            </Span>
          )}
        </LinkContext.Consumer>
      )
    }
    case 'list': {
      const children = node.childIds || []
      return (
        <Block
          type="list"
          extra={`${children.length} ${
            children.length === 1 ? 'item' : 'items'
          }`}
        >
          <ul>{renderChildren()}</ul>
        </Block>
      )
    }
    case 'listitem': {
      return <li>{renderChildren()}</li>
    }
    case 'separator': {
      return <Block type="horizontal splitter" />
    }
    default: {
      return renderError(`Unknown role ${role}`)
    }
  }
}

function Span(props: {
  type: string
  children: ReactNode
  placement?: 'before' | 'after'
}) {
  return (
    <>
      {' '}
      <span className="Span">
        {props.placement !== 'after' && (
          <span className="Span-type">{props.type}, </span>
        )}
        {props.children}
        {props.placement === 'after' && (
          <span className="Span-type">, {props.type}</span>
        )}
      </span>
    </>
  )
}
function Block(props: { type: string; extra?: string; children?: ReactNode }) {
  return (
    <div className="Block">
      <div className="Block-title">
        {props.type}
        {props.extra ? ', ' + props.extra : ''}
      </div>
      {props.children ? (
        <>
          <div className="Block-content">{props.children}</div>
          <div className="Block-title">end of {props.type}</div>
        </>
      ) : (
        ''
      )}
    </div>
  )
}

function renderError(text: string) {
  return <span style={{ background: 'red' }}>{text}</span>
}

const App: React.FC = () => {
  const [tree, setTree] = useState<Tree>(exampleTree)
  useEffect(() => {
    window.ondragover = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      document.documentElement.classList.add('dropit')
    }
    window.ondragleave = (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      document.documentElement.classList.remove('dropit')
    }
    window.ondrop = async (e: DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      document.documentElement.classList.remove('dropit')
      try {
        var dt = e.dataTransfer!
        var files = dt.files
        const json = await (files[0] as any).text()
        setTree(JSON.parse(json))
        sessionStorage.accessibilityTree = json
      } catch (e) {
        alert(String(e))
      }
    }
    document.onpaste = async (e: ClipboardEvent) => {
      e.preventDefault()
      e.stopPropagation()
      try {
        const text = e.clipboardData!.getData('text')
        await new Promise(resolve => requestAnimationFrame(resolve))
        setTree(JSON.parse(text))
        sessionStorage.accessibilityTree = text
      } catch (e) {
        alert(String(e))
      }
    }
    setTimeout(() => {
      if (sessionStorage.accessibilityTree) {
        setTree(JSON.parse(sessionStorage.accessibilityTree))
      }
    })
  }, [])
  return (
    <div className="App">
      <h1>Accessibility tree visualizer</h1>
      <p>Drop (or paste) a Chrome accessibility tree dump (JSON file) here.</p>
      <div className="Tree">
        <TreeProvider tree={tree}>
          {context => <Tree nodeId={context.rootNodeId} />}
        </TreeProvider>
      </div>
    </div>
  )
}

export default App
