import React, {
  Component,
  PropTypes,
} from 'react'

import {
  fromJS,
} from 'immutable'

import {
  Editor,
  Modifier,
  Entity,
  EditorState,
  ContentState,
  SelectionState,
  CompositeDecorator,
} from 'draft-js'

function getContentState(filters) {
  let contentState = ContentState.createFromText(
    filters.map(({ category, operator='', option='' }) => (
      `${category}${operator}${option}`
    )).join(' ')
  );
  const contentBlock = contentState.getFirstBlock();
  //
  let anchorOffset = 0;
  let focusOffset = 0;
  filters.forEach(({ category, operator='', option='' }) => {
    [['CATEGORY', category], ['OPERATOR', operator], ['OPTION', option]].forEach(([type, it]) => {
      if (!it) {
        return;
      }
      anchorOffset = focusOffset;
      focusOffset += it.length;

      const selectionState = SelectionState
        .createEmpty(contentBlock.getKey())
        .set('anchorOffset', anchorOffset)
        .set('focusOffset', focusOffset);

      contentState = Modifier.applyEntity(
        contentState,
        selectionState,
        Entity.create(type, 'IMMUTABLE', {
          text: it,
        })
      );
    });

    anchorOffset += 1;
    focusOffset += 1;
  });
  return contentState;
}

function getDecorator() {
  return new CompositeDecorator([
    {
      strategy(contentBlock, callback) {
        contentBlock.findEntityRanges(
          (character) => {
            const entityKey = character.getEntity();
            return (
              entityKey !== null &&
              Entity.get(entityKey).getType() === 'CATEGORY'
            );
          },
          callback
        );
      },
      component(props) {
        const data = Entity.get(props.entityKey).getData();
        return (
          <span data={JSON.stringify(data)} style={{ border: '1px solid green' }}>
            {props.children}
          </span>
        );
      },
    },
    {
      strategy(contentBlock, callback) {
        contentBlock.findEntityRanges(
          (character) => {
            const entityKey = character.getEntity();
            return (
              entityKey !== null &&
              Entity.get(entityKey).getType() === 'OPERATOR'
            );
          },
          callback
        );
      },
      component(props) {
        const data = Entity.get(props.entityKey).getData();
        return (
          <span data={JSON.stringify(data)} style={{ border: '1px solid red' }}>
            {props.children}
          </span>
        );
      },
    },
    {
      strategy(contentBlock, callback) {
        contentBlock.findEntityRanges(
          (character) => {
            const entityKey = character.getEntity();
            return (
              entityKey !== null &&
              Entity.get(entityKey).getType() === 'OPTION'
            );
          },
          callback
        );
      },
      component(props) {
        const data = Entity.get(props.entityKey).getData();
        return (
          <span data={JSON.stringify(data)} style={{ border: '1px solid blue' }}>
            {props.children}
          </span>
        );
      },
    },
    {
      strategy(contentBlock, callback) {
        contentBlock.findEntityRanges(
          (character) => {
            const entityKey = character.getEntity();
            return (
              entityKey !== null &&
              Entity.get(entityKey).getType() === 'AUTOCOMPLETE_CATEGORIES'
            );
          },
          callback
        );
      },
      component(props) {
        const { entityKey } = props;
        const { onUpdateSelection } = Entity.get(entityKey).getData();
        const query = props.decoratedText;
        const handleClick = text => event => {
          event.preventDefault();
          event.stopPropagation();
          onUpdateSelection(entityKey, text, 'CATEGORY');
        };
        return (
          <span data-query={query} style={{ border: '5px solid green', position: 'relative' }}>
            {props.children}
            <ul style={{ position: 'absolute', top: '20px', left: '0' }} contentEditable={false}>
              <li onClick={handleClick('category a')}>category a</li>
              <li onClick={handleClick('category c')}>category c</li>
              <li onClick={handleClick('category b')}>category b</li>
            </ul>
          </span>
        );
      },
    },
    {
      strategy(contentBlock, callback) {
        contentBlock.findEntityRanges(
          (character) => {
            const entityKey = character.getEntity();
            return (
              entityKey !== null &&
              Entity.get(entityKey).getType() === 'AUTOCOMPLETE_OPERATORS'
            );
          },
          callback
        );
      },
      component(props) {
        const { entityKey } = props;
        const { onUpdateSelection } = Entity.get(entityKey).getData();
        const query = props.decoratedText;
        const handleClick = text => event => {
          event.preventDefault();
          event.stopPropagation();
          onUpdateSelection(entityKey, text, 'OPERATOR');
        };
        return (
          <span data-query={query} style={{ border: '5px solid red', position: 'relative' }}>
            {props.children}
            <ul style={{ position: 'absolute', top: '20px', left: '0' }} contentEditable={false}>
              <li onClick={handleClick('=')}>{'='}</li>
              <li onClick={handleClick('>=')}>{'>='}</li>
              <li onClick={handleClick('<=')}>{'<='}</li>
            </ul>
          </span>
        );
      },
    },
    {
      strategy(contentBlock, callback) {
        contentBlock.findEntityRanges(
          (character) => {
            const entityKey = character.getEntity();
            return (
              entityKey !== null &&
              Entity.get(entityKey).getType() === 'AUTOCOMPLETE_OPTIONS'
            );
          },
          callback
        );
      },
      component(props) {
        const { entityKey } = props;
        const { onUpdateSelection } = Entity.get(entityKey).getData();
        const query = props.decoratedText;
        const handleClick = text => event => {
          event.preventDefault();
          event.stopPropagation();
          onUpdateSelection(entityKey, text, 'OPTION');
        };
        return (
          <span data-query={query} style={{ border: '5px solid blue', position: 'relative' }}>
            {props.children}
            <ul style={{ position: 'absolute', top: '20px', left: '0' }} contentEditable={false}>
              <li onClick={handleClick('option 1')}>option 1</li>
              <li onClick={handleClick('option 3')}>option 3</li>
              <li onClick={handleClick('option 2')}>option 2</li>
            </ul>
          </span>
        );
      },
    },
  ]);
}

const FILTER_ENTITY_TYPES = fromJS([
  'CATEGORY',
  'OPERATOR',
  'OPTION',
]);

function getNextEntityType(prevEntityType) {
  switch (prevEntityType) {
    case 'CATEGORY':
      return 'AUTOCOMPLETE_OPERATORS';
    case 'OPERATOR':
      return 'AUTOCOMPLETE_OPTIONS';
    case 'OPTION':
      return 'AUTOCOMPLETE_CATEGORIES';
    default:
      return prevEntityType;
  }
}

function createEditorStateFromFilters(filters) {
  return EditorState.moveSelectionToEnd(
    EditorState.createWithContent(
      getContentState(filters),
      getDecorator()
    )
  );
}

function getFilterEntitiesCount(contentBlock) {
  return contentBlock
    .getCharacterList()
    .map(character => character.getEntity())
    .filter(entityKey => entityKey !== null)
    .map(entityKey => Entity.get(entityKey).getType())
    .filter(entityType => FILTER_ENTITY_TYPES.includes(entityType))
    .count();
}

class FacetFilter extends Component {

  static propTypes = {
    filters: PropTypes.array(
      PropTypes.shape({
        category: PropTypes.string.isRequired,
        operator: PropTypes.string,
        option: PropTypes.string,
      })
    ).isRequired,
    onFiltersChange: PropTypes.func.isRequired,
  };

  state = {
    editorState: createEditorStateFromFilters(this.props.filters),
  };

  handlePublishEditorStateToFilters = this.publishEditorStateToFilters.bind(this);
  onChange = (nextEditorState) => {
    let isFilterEntityRemoved;
    this.setState(state => {
      const editorStateResult = this.getNextEditorState(state.editorState, nextEditorState);
      isFilterEntityRemoved = editorStateResult.isFilterEntityRemoved;
      return {
        editorState: editorStateResult.nextEditorState,
      };
    }, () => {
      if (isFilterEntityRemoved) {
        this.handlePublishEditorStateToFilters();
      }
    });
  };
  onUpdateSelectionState = (prevEntityKey, text, textEntityType) => {
    this.setState(state => ({
      editorState: this.updateSelectionFromAutoComplete(
        state.editorState,
        prevEntityKey,
        text,
        textEntityType
      ),
    }), this.handlePublishEditorStateToFilters)
  };

  getNextEditorState(prevEditorState, nextEditorState) {
    const prevFirstBlock = prevEditorState.getCurrentContent().getFirstBlock();
    const nextFirstBlock = nextEditorState.getCurrentContent().getFirstBlock();
    //
    const prevSelection = prevEditorState.getSelection();
    let prevEntityKey = (
      prevFirstBlock.getLength() > 0 ?
      prevFirstBlock.getEntityAt(prevSelection.getEndOffset() - 1) :
      null
    );
    let expectingEntityType = 'AUTOCOMPLETE_CATEGORIES'
    if (prevEntityKey) {
      const prevEntityType = Entity.get(prevEntityKey).getType();
      expectingEntityType = getNextEntityType(prevEntityType);
      //
      let found = false;
      nextFirstBlock.findEntityRanges(
        character => character.getEntity() === prevEntityKey,
        () => { found = true }
      );
      if (!found) {
        // Entity was removed, so we need to delete data
        Entity.replaceData(prevEntityKey, {});
        prevEntityKey = null;
      }
    } else {
      expectingEntityType = 'AUTOCOMPLETE_CATEGORIES';
    }
    //
    if (prevFirstBlock.getLength() >= nextFirstBlock.getLength()) {
      const isFilterEntityRemoved = (
        getFilterEntitiesCount(prevFirstBlock) > getFilterEntitiesCount(nextFirstBlock)
      );
      return {
        isFilterEntityRemoved,
        nextEditorState,
      };
    } else if (prevEntityKey && Entity.get(prevEntityKey).getType() === expectingEntityType) {
      return {
        isFilterEntityRemoved: false,
        nextEditorState,
      };
    } else {
      const nextSelection = nextEditorState.getSelection();
      //
      const nextEntityKey = Entity.create(expectingEntityType, 'MUTABLE', {
        onUpdateSelection: this.onUpdateSelectionState,
      });
      const nextContentState = Modifier.applyEntity(
        nextEditorState.getCurrentContent(),
        SelectionState
          .createEmpty(nextFirstBlock.getKey())
          .set('anchorOffset', prevSelection.getStartOffset())
          .set('focusOffset', nextSelection.getEndOffset()),
        nextEntityKey
      );
      return {
        isFilterEntityRemoved: false,
        nextEditorState: EditorState.forceSelection(
          EditorState.push(
            nextEditorState,
            nextContentState,
            'apply-entity'
          ),
          SelectionState
            .createEmpty(nextFirstBlock.getKey())
            .set('anchorOffset', nextSelection.getEndOffset())
            .set('focusOffset', nextSelection.getEndOffset())
        ),
      };
    }
  }

  updateSelectionFromAutoComplete(prevEditorState, prevEntityKey, text, textEntityType) {
    const prevContentState = prevEditorState.getCurrentContent();
    const prevFirstBlock = prevContentState.getFirstBlock();
    let rangeToReplace;
    //
    prevFirstBlock.findEntityRanges(
      character => character.getEntity() === prevEntityKey,
      (start, end) => {
        rangeToReplace = SelectionState
          .createEmpty(prevFirstBlock.getKey())
          .set('anchorOffset', start)
          .set('focusOffset', end);
      }
    );
    const nextEntityKey = Entity.create(textEntityType, 'IMMUTABLE', {
      text,
    });
    const nextContentState = Modifier.replaceText(
      prevContentState,
      rangeToReplace,
      text,
      null,
      nextEntityKey
    );
    return EditorState.push(
      prevEditorState,
      nextContentState,
      'apply-entity'
    );
  }

  getFiltersFromEditorState(editorState) {
    const NullEntity = {
      getData() {
        return {
          text: ''
        };
      },
    };

    return editorState
      .getCurrentContent()
      .getFirstBlock()
      .getCharacterList()
      .map(character => character.getEntity())
      .filter(it => it !== null)
      .toOrderedSet()
      .map(entityKey => Entity.get(entityKey))
      .groupBy(function grouper() {
        if (this.count === 3) {
          this.index += 1;
          this.count = 1;
        } else {
          this.count += 1;
        }
        return this.index;
      }, {
        index: 0,
        count: 0,
      })
      .valueSeq()
      .map(entities => entities.toIndexedSeq())
      .map(entities => fromJS({
        category: entities.get(0).getData().text,
        operator: (entities.get(1) || NullEntity).getData().text,
        option: (entities.get(2) || NullEntity).getData().text,
      }));
  }

  publishEditorStateToFilters() {
    const filters = this.getFiltersFromEditorState(this.state.editorState).toJS();
    this.props.onFiltersChange(filters);
  }

  // TODO: Link CWRP for new filters
  componentWillReceiveProps(nextProps) {
    const nextFiltersFromProps = fromJS(nextProps.filters);
    const nextFiltersFromState = this.getFiltersFromEditorState(this.state.editorState)

    const isFiltersMatch = nextFiltersFromProps.equals(nextFiltersFromState);
    if (!isFiltersMatch) {
      this.setState({
        editorState: createEditorStateFromFilters(nextProps.filters),
      });
    }
  }

  render() {
    return (
      <Editor
        // TODO: this.props
        editorState={this.state.editorState}
        onChange={this.onChange}
        placeholder="Write a tweet..."
        spellCheck
      />
    );
  }
}


class DraftjsPOCDemo extends Component {
  state = {
    filters: [
      {
        category: 'category',
        operator: ':',
        option: 'option',
      },
      {
        category: 'category2th',
        operator: '=>',
        option: undefined,
      },
    ],
  };

  handleFiltersChange = (filters) => {
    console.log(filters);
    this.setState({ filters });
  }

  resetFilters = () => this.setState({
    filters: [
      {
        category: 'newCategory',
        operator: ':=',
        option: 'newOption',
      },
    ],
  })

  render() {
    const styles = {
      root: {
        fontFamily: '\'Helvetica\', sans-serif',
        padding: 20,
        width: 600,
      },
      editor: {
        border: '1px solid #ddd',
        cursor: 'text',
        fontSize: 16,
        minHeight: 40,
        padding: 10,
      },
      button: {
        marginTop: 10,
        textAlign: 'center',
      },
    };

    return (
      <div style={styles.root}>
        <div style={styles.editor} onClick={this.focus}>
          <FacetFilter
            filters={this.state.filters}
            onFiltersChange={this.handleFiltersChange}
          />
        </div>
        <input
          onClick={this.resetFilters}
          style={styles.button}
          type="button"
          value="Reset filters"
        />
      </div>
    );
  }
}

export default DraftjsPOCDemo
